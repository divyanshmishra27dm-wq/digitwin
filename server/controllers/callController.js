const Call = require('../models/Call');
const Twin = require('../models/Twin');
const { generateCallTurn, generateCallSummary } = require('../services/callAIService');

// Verify twin accessibility for user
async function checkTwinAccess(twinIds, user) {
  const isAdmin = user?.role === 'admin';
  const twins = await Twin.find({ _id: { $in: twinIds } });
  if (twins.length !== twinIds.length) {
    throw new Error('One or more selected Digital Twins could not be found.');
  }

  if (!isAdmin) {
    const userDept = user?.dept || 'Engineering';
    for (const twin of twins) {
      if (twin.status !== 'published' && twin.createdBy?.toString() !== user._id.toString()) {
        throw new Error(`Twin "${twin.name}" is not published.`);
      }
      const isSameDept = twin.dept === userDept;
      const isGlobal = twin.visibility === 'all';
      const isCreator = twin.createdBy?.toString() === user._id.toString();
      if (!isGlobal && !isSameDept && !isCreator) {
        throw new Error(`Twin "${twin.name}" belongs to "${twin.dept}" and is not accessible to "${userDept}".`);
      }
    }
  }

  return twins;
}

// GET /api/calls — List all calls for current user
exports.listCalls = async (req, res, next) => {
  try {
    const calls = await Call.find({ userId: req.user._id })
      .populate('twins', 'name title avatarInitials dept organization')
      .populate('userId', 'name email title dept')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ calls });
  } catch (err) {
    next(err);
  }
};

// GET /api/calls/:id — Get call detail with full transcript
exports.getCall = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('twins', 'name title avatarInitials dept organization bio tagline expertise communicationStyle thinkingPatterns')
      .populate('userId', 'name email title dept');

    if (!call) return res.status(404).json({ message: 'Call not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && call.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ call });
  } catch (err) {
    next(err);
  }
};

// POST /api/calls — Start new team call or debate
exports.createCall = async (req, res, next) => {
  try {
    const { title, topic, mode = 'team_call', twinIds = [], initialUserSpeech } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'A call topic or agenda is required.' });
    }
    if (!Array.isArray(twinIds) || twinIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least 1 Digital Twin to invite.' });
    }

    const validTwins = await checkTwinAccess(twinIds, req.user);
    const callTitle = (title && title.trim()) || `Call: ${topic.trim().slice(0, 50)}`;

    const call = new Call({
      userId: req.user._id,
      title: callTitle,
      topic: topic.trim(),
      mode,
      twins: validTwins.map((t) => t._id),
      turns: [],
      status: 'active',
      startedAt: new Date(),
    });

    // If initial user speech provided
    if (initialUserSpeech && initialUserSpeech.trim()) {
      call.turns.push({
        turnNumber: 1,
        speakerRole: 'user',
        speakerName: req.user.name || 'Caller',
        speakerTitle: req.user.title || 'Team Host',
        speakerAvatarInitials: (req.user.name || 'U').slice(0, 2).toUpperCase(),
        speakerDept: req.user.dept || 'General',
        content: initialUserSpeech.trim(),
        spokenText: initialUserSpeech.trim(),
        perspective: 'Host Framing & Question',
        timestamp: new Date(),
      });
    }

    // Opening greeting turn from first twin
    const firstTwin = validTwins[0];
    const firstTurn = await generateCallTurn({
      call,
      speakingTwin: firstTwin,
      allTwins: validTwins,
      user: req.user,
      isDebate: mode === 'debate',
      userMessage: initialUserSpeech || null,
    });

    call.turns.push({
      turnNumber: call.turns.length + 1,
      speakerRole: 'twin',
      twinId: firstTwin._id,
      speakerName: firstTwin.name,
      speakerTitle: firstTwin.title,
      speakerAvatarInitials: firstTwin.avatarInitials,
      speakerDept: firstTwin.dept,
      content: firstTurn.content,
      spokenText: firstTurn.spokenText,
      perspective: firstTurn.perspective,
      addressedTo: firstTurn.addressedTo,
      questionTarget: firstTurn.questionTarget,
      directQuestion: firstTurn.directQuestion,
      isDebateChallenge: firstTurn.isDebateChallenge,
      timestamp: new Date(),
    });

    await call.save();

    const populated = await Call.findById(call._id)
      .populate('twins', 'name title avatarInitials dept organization bio tagline expertise communicationStyle thinkingPatterns')
      .populate('userId', 'name email title dept');

    res.status(201).json({ call: populated });
  } catch (err) {
    next(err);
  }
};

// POST /api/calls/:id/speech — User speaks into the call
exports.userSpeech = async (req, res, next) => {
  try {
    const { message, targetTwinId, interruptedTwin } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Speech message cannot be empty.' });
    }

    const call = await Call.findById(req.params.id).populate('twins');
    if (!call) return res.status(404).json({ message: 'Call not found.' });
    if (call.status === 'ended') {
      return res.status(400).json({ message: 'This call has already ended.' });
    }

    const userTurn = {
      turnNumber: call.turns.length + 1,
      speakerRole: 'user',
      speakerName: req.user.name || 'Caller',
      speakerTitle: req.user.title || 'Team Host',
      speakerAvatarInitials: (req.user.name || 'U').slice(0, 2).toUpperCase(),
      speakerDept: req.user.dept || 'General',
      content: message.trim(),
      spokenText: message.trim(),
      perspective: interruptedTwin ? 'Voice Interruption' : 'Voice Question / Intervention',
      timestamp: new Date(),
    };

    call.turns.push(userTurn);

    // Determine responding twin
    let respondingTwin = null;
    const allTwins = call.twins;

    if (targetTwinId) {
      respondingTwin = allTwins.find((t) => t._id.toString() === targetTwinId.toString());
    }

    // If interrupted a specific twin and no target twin was explicitly stated in prompt,
    // give the floor back to the interrupted twin so they can acknowledge and complete their point!
    if (!respondingTwin && interruptedTwin?.twinId) {
      respondingTwin = allTwins.find((t) => t._id.toString() === interruptedTwin.twinId.toString());
    } else if (!respondingTwin && interruptedTwin?.name) {
      respondingTwin = allTwins.find((t) => t.name.toLowerCase().includes(interruptedTwin.name.toLowerCase()));
    }

    // Check if user mentioned another twin by name in speech
    if (!respondingTwin) {
      const lowerSpeech = message.toLowerCase();
      respondingTwin = allTwins.find((t) => {
        const firstName = t.name.split(' ')[0].toLowerCase();
        return lowerSpeech.includes(firstName) || lowerSpeech.includes(t.name.toLowerCase());
      });
    }

    // Default to first twin or circular next
    if (!respondingTwin && allTwins.length > 0) {
      const twinTurns = call.turns.filter((t) => t.speakerRole === 'twin');
      if (twinTurns.length === 0) {
        respondingTwin = allTwins[0];
      } else {
        const lastTwinId = twinTurns[twinTurns.length - 1].twinId?.toString();
        const lastIdx = allTwins.findIndex((t) => t._id.toString() === lastTwinId);
        const nextIdx = (lastIdx + 1) % allTwins.length;
        respondingTwin = allTwins[nextIdx];
      }
    }

    let newTwinTurn = null;
    if (respondingTwin) {
      const turnResult = await generateCallTurn({
        call,
        speakingTwin: respondingTwin,
        allTwins,
        user: req.user,
        userMessage: message.trim(),
        isDebate: call.mode === 'debate',
        interruptedTwin: interruptedTwin || null,
      });

      newTwinTurn = {
        turnNumber: call.turns.length + 1,
        speakerRole: 'twin',
        twinId: respondingTwin._id,
        speakerName: respondingTwin.name,
        speakerTitle: respondingTwin.title,
        speakerAvatarInitials: respondingTwin.avatarInitials,
        speakerDept: respondingTwin.dept,
        content: turnResult.content,
        spokenText: turnResult.spokenText,
        perspective: turnResult.perspective,
        addressedTo: turnResult.addressedTo,
        questionTarget: turnResult.questionTarget,
        directQuestion: turnResult.directQuestion,
        isDebateChallenge: turnResult.isDebateChallenge,
        timestamp: new Date(),
      };

      call.turns.push(newTwinTurn);
    }

    await call.save();

    res.json({
      call,
      userTurn,
      newTwinTurn,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/calls/:id/next-speaker — Trigger a twin turn (manual or debate progression)
exports.triggerNextSpeaker = async (req, res, next) => {
  try {
    const { targetTwinId, instruction } = req.body;
    const call = await Call.findById(req.params.id).populate('twins');
    if (!call) return res.status(404).json({ message: 'Call not found.' });
    if (call.status === 'ended') {
      return res.status(400).json({ message: 'This call has already ended.' });
    }

    const allTwins = call.twins;
    if (allTwins.length === 0) {
      return res.status(400).json({ message: 'No digital twins are in this call.' });
    }

    let speakingTwin = null;
    if (targetTwinId) {
      speakingTwin = allTwins.find((t) => t._id.toString() === targetTwinId.toString());
      if (!speakingTwin) return res.status(400).json({ message: 'Target twin is not on this call.' });
    } else {
      // Check if previous turn asked a specific twin
      const lastTurn = call.turns[call.turns.length - 1];
      if (lastTurn && lastTurn.questionTarget && lastTurn.questionTarget !== 'user' && lastTurn.questionTarget !== 'all') {
        speakingTwin = allTwins.find((t) =>
          t.name.toLowerCase().includes(lastTurn.questionTarget.toLowerCase())
        );
      }

      // If not, pick next twin in order
      if (!speakingTwin) {
        const twinTurns = call.turns.filter((t) => t.speakerRole === 'twin');
        if (twinTurns.length === 0) {
          speakingTwin = allTwins[0];
        } else {
          const lastTwinId = twinTurns[twinTurns.length - 1].twinId?.toString();
          const lastIdx = allTwins.findIndex((t) => t._id.toString() === lastTwinId);
          const nextIdx = (lastIdx + 1) % allTwins.length;
          speakingTwin = allTwins[nextIdx];
        }
      }
    }

    const turnResult = await generateCallTurn({
      call,
      speakingTwin,
      allTwins,
      user: req.user,
      isDebate: call.mode === 'debate',
      userInstruction: instruction,
    });

    const newTurn = {
      turnNumber: call.turns.length + 1,
      speakerRole: 'twin',
      twinId: speakingTwin._id,
      speakerName: speakingTwin.name,
      speakerTitle: speakingTwin.title,
      speakerAvatarInitials: speakingTwin.avatarInitials,
      speakerDept: speakingTwin.dept,
      content: turnResult.content,
      spokenText: turnResult.spokenText,
      perspective: turnResult.perspective,
      addressedTo: turnResult.addressedTo,
      questionTarget: turnResult.questionTarget,
      directQuestion: turnResult.directQuestion,
      isDebateChallenge: turnResult.isDebateChallenge,
      timestamp: new Date(),
    };

    call.turns.push(newTurn);
    await call.save();

    res.json({
      call,
      newTurn,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/calls/:id/invite — Invite / summon additional twins to active call
exports.inviteTwins = async (req, res, next) => {
  try {
    const { twinIds = [] } = req.body;
    if (!Array.isArray(twinIds) || twinIds.length === 0) {
      return res.status(400).json({ message: 'Please provide twin IDs to invite.' });
    }

    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call not found.' });

    const validTwins = await checkTwinAccess(twinIds, req.user);
    const currentIds = new Set(call.twins.map((t) => t.toString()));
    const newlyAdded = [];

    for (const twin of validTwins) {
      if (!currentIds.has(twin._id.toString())) {
        call.twins.push(twin._id);
        newlyAdded.push(twin);
      }
    }

    if (newlyAdded.length > 0) {
      // Announce arrival on call
      const names = newlyAdded.map((t) => t.name).join(', ');
      call.turns.push({
        turnNumber: call.turns.length + 1,
        speakerRole: 'user',
        speakerName: 'Conference System',
        speakerTitle: 'Automated Notification',
        speakerAvatarInitials: 'SYS',
        speakerDept: 'Call Room',
        content: `*${names} joined the call.*`,
        spokenText: `${names} joined the call.`,
        perspective: 'System Update',
        timestamp: new Date(),
      });
    }

    await call.save();

    const populated = await Call.findById(call._id)
      .populate('twins', 'name title avatarInitials dept organization bio tagline expertise communicationStyle thinkingPatterns')
      .populate('userId', 'name email title dept');

    res.json({ call: populated, addedTwins: newlyAdded });
  } catch (err) {
    next(err);
  }
};

// POST /api/calls/:id/end — End the call and generate executive summary
exports.endCall = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.id).populate('twins');
    if (!call) return res.status(404).json({ message: 'Call not found.' });

    call.status = 'ended';
    call.endedAt = new Date();

    const summary = await generateCallSummary({ call });
    call.summary = summary;

    await call.save();

    res.json({ call, summary });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/calls/:id — Delete call record
exports.deleteCall = async (req, res, next) => {
  try {
    const call = await Call.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Call not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && call.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Call.findByIdAndDelete(req.params.id);
    res.json({ message: 'Call record deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
