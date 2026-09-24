const Roundtable = require('../models/Roundtable');
const Twin = require('../models/Twin');
const { generateTwinRoundtableTurn, generateRoundtableSummary } = require('../services/multiTwinService');

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

// GET /api/roundtables — list roundtables
exports.listRoundtables = async (req, res, next) => {
  try {
    const isAdmin = req.query.all === '1' && req.user.role === 'admin';
    const filter = isAdmin ? {} : { userId: req.user._id };

    const roundtables = await Roundtable.find(filter)
      .populate('twins', 'name title avatarInitials dept organization')
      .populate('userId', 'name email title dept')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ roundtables });
  } catch (err) {
    next(err);
  }
};

// GET /api/roundtables/:id — get roundtable detail
exports.getRoundtable = async (req, res, next) => {
  try {
    const roundtable = await Roundtable.findById(req.params.id)
      .populate('twins', 'name title avatarInitials dept organization bio tagline expertise communicationStyle thinkingPatterns')
      .populate('userId', 'name email title dept');

    if (!roundtable) return res.status(404).json({ message: 'Roundtable session not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && roundtable.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ roundtable });
  } catch (err) {
    next(err);
  }
};

// POST /api/roundtables — create new roundtable
exports.createRoundtable = async (req, res, next) => {
  try {
    const { title, topic, discussionMode = 'problem_solving', twinIds = [], initialPrompt } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'A topic or problem statement is required.' });
    }
    if (!Array.isArray(twinIds) || twinIds.length < 2) {
      return res.status(400).json({ message: 'Please select at least 2 Digital Twins to summon.' });
    }

    const validTwins = await checkTwinAccess(twinIds, req.user);

    const roundtableTitle = (title && title.trim()) || topic.trim().slice(0, 60);

    const roundtable = new Roundtable({
      userId: req.user._id,
      title: roundtableTitle,
      topic: topic.trim(),
      discussionMode,
      twins: validTwins.map((t) => t._id),
      turns: [],
    });

    // Add initial user prompt if given
    if (initialPrompt && initialPrompt.trim()) {
      roundtable.turns.push({
        turnNumber: 1,
        round: 1,
        speakerRole: 'user',
        speakerName: req.user.name || 'Moderator',
        speakerTitle: req.user.title || 'Discussion Initiator',
        speakerAvatarInitials: (req.user.name || 'U').slice(0, 2).toUpperCase(),
        speakerDept: req.user.dept || 'General',
        content: initialPrompt.trim(),
        perspective: 'Topic Framing & Goals',
      });
    }

    // Automatically trigger turn for first twin to kick off discussion
    const firstTwin = validTwins[0];
    const turnResult = await generateTwinRoundtableTurn({
      roundtable,
      speakingTwin: firstTwin,
      allTwins: validTwins,
      user: req.user,
    });

    roundtable.turns.push({
      turnNumber: roundtable.turns.length + 1,
      round: 1,
      speakerRole: 'twin',
      twinId: firstTwin._id,
      speakerName: firstTwin.name,
      speakerTitle: firstTwin.title,
      speakerAvatarInitials: firstTwin.avatarInitials,
      speakerDept: firstTwin.dept,
      content: turnResult.content,
      perspective: turnResult.perspective,
      addressedTo: turnResult.addressedTo,
      keyTakeaway: turnResult.keyTakeaway,
      sources: turnResult.sources,
    });

    await roundtable.save();

    const populated = await Roundtable.findById(roundtable._id)
      .populate('twins', 'name title avatarInitials dept organization bio tagline expertise communicationStyle thinkingPatterns')
      .populate('userId', 'name email title dept');

    res.status(201).json({ roundtable: populated });
  } catch (err) {
    next(err);
  }
};

// POST /api/roundtables/:id/turn — trigger next turn or specific twin turn
exports.triggerTurn = async (req, res, next) => {
  try {
    const { targetTwinId, instruction } = req.body;
    const roundtable = await Roundtable.findById(req.params.id).populate('twins');

    if (!roundtable) return res.status(404).json({ message: 'Roundtable session not found.' });

    const allTwins = roundtable.twins;
    if (allTwins.length === 0) {
      return res.status(400).json({ message: 'No twins summoned in this roundtable.' });
    }

    let speakingTwin = null;
    if (targetTwinId) {
      speakingTwin = allTwins.find((t) => t._id.toString() === targetTwinId.toString());
      if (!speakingTwin) return res.status(400).json({ message: 'Target twin is not in this roundtable.' });
    } else {
      // Find who spoke last, pick next twin in circular order
      const twinTurns = (roundtable.turns || []).filter((t) => t.speakerRole === 'twin');
      if (twinTurns.length === 0) {
        speakingTwin = allTwins[0];
      } else {
        const lastTwinId = twinTurns[twinTurns.length - 1].twinId?.toString();
        const lastIdx = allTwins.findIndex((t) => t._id.toString() === lastTwinId);
        const nextIdx = (lastIdx + 1) % allTwins.length;
        speakingTwin = allTwins[nextIdx];
      }
    }

    const currentRound = Math.floor((roundtable.turns.filter((t) => t.speakerRole === 'twin').length) / allTwins.length) + 1;

    const turnResult = await generateTwinRoundtableTurn({
      roundtable,
      speakingTwin,
      allTwins,
      user: req.user,
      userInstruction: instruction,
    });

    const newTurn = {
      turnNumber: roundtable.turns.length + 1,
      round: currentRound,
      speakerRole: 'twin',
      twinId: speakingTwin._id,
      speakerName: speakingTwin.name,
      speakerTitle: speakingTwin.title,
      speakerAvatarInitials: speakingTwin.avatarInitials,
      speakerDept: speakingTwin.dept,
      content: turnResult.content,
      perspective: turnResult.perspective,
      addressedTo: turnResult.addressedTo,
      keyTakeaway: turnResult.keyTakeaway,
      sources: turnResult.sources,
    };

    roundtable.turns.push(newTurn);
    await roundtable.save();

    res.json({
      turn: roundtable.turns[roundtable.turns.length - 1],
      roundtable,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/roundtables/:id/user-message — user intervenes / poses question
exports.addUserMessage = async (req, res, next) => {
  try {
    const { message, triggerNext = true } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const roundtable = await Roundtable.findById(req.params.id).populate('twins');
    if (!roundtable) return res.status(404).json({ message: 'Roundtable session not found.' });

    const userTurn = {
      turnNumber: roundtable.turns.length + 1,
      round: Math.floor(roundtable.turns.filter((t) => t.speakerRole === 'twin').length / Math.max(1, roundtable.twins.length)) + 1,
      speakerRole: 'user',
      speakerName: req.user.name || 'User Moderator',
      speakerTitle: req.user.title || 'Discussion Facilitator',
      speakerAvatarInitials: (req.user.name || 'U').slice(0, 2).toUpperCase(),
      speakerDept: req.user.dept || 'General',
      content: message.trim(),
      perspective: 'Moderator Guidance / Prompt',
    };

    roundtable.turns.push(userTurn);

    let nextTwinTurn = null;
    if (triggerNext && roundtable.twins.length > 0) {
      // Pick next twin
      const twinTurns = roundtable.turns.filter((t) => t.speakerRole === 'twin');
      const lastTwinId = twinTurns.length > 0 ? twinTurns[twinTurns.length - 1].twinId?.toString() : null;
      const lastIdx = roundtable.twins.findIndex((t) => t._id.toString() === lastTwinId);
      const nextIdx = (lastIdx + 1) % roundtable.twins.length;
      const speakingTwin = roundtable.twins[nextIdx];

      const turnResult = await generateTwinRoundtableTurn({
        roundtable,
        speakingTwin,
        allTwins: roundtable.twins,
        user: req.user,
        userInstruction: message.trim(),
      });

      nextTwinTurn = {
        turnNumber: roundtable.turns.length + 1,
        round: userTurn.round,
        speakerRole: 'twin',
        twinId: speakingTwin._id,
        speakerName: speakingTwin.name,
        speakerTitle: speakingTwin.title,
        speakerAvatarInitials: speakingTwin.avatarInitials,
        speakerDept: speakingTwin.dept,
        content: turnResult.content,
        perspective: turnResult.perspective,
        addressedTo: turnResult.addressedTo,
        keyTakeaway: turnResult.keyTakeaway,
        sources: turnResult.sources,
      };

      roundtable.turns.push(nextTwinTurn);
    }

    await roundtable.save();

    res.json({
      roundtable,
      userTurn,
      nextTwinTurn,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/roundtables/:id/auto-round — run a full round across all participating twins
exports.autoRound = async (req, res, next) => {
  try {
    const roundtable = await Roundtable.findById(req.params.id).populate('twins');
    if (!roundtable) return res.status(404).json({ message: 'Roundtable session not found.' });

    const allTwins = roundtable.twins;
    const addedTurns = [];
    const currentRound = Math.floor(roundtable.turns.filter((t) => t.speakerRole === 'twin').length / allTwins.length) + 1;

    for (const twin of allTwins) {
      const turnResult = await generateTwinRoundtableTurn({
        roundtable,
        speakingTwin: twin,
        allTwins,
        user: req.user,
      });

      const newTurn = {
        turnNumber: roundtable.turns.length + 1,
        round: currentRound,
        speakerRole: 'twin',
        twinId: twin._id,
        speakerName: twin.name,
        speakerTitle: twin.title,
        speakerAvatarInitials: twin.avatarInitials,
        speakerDept: twin.dept,
        content: turnResult.content,
        perspective: turnResult.perspective,
        addressedTo: turnResult.addressedTo,
        keyTakeaway: turnResult.keyTakeaway,
        sources: turnResult.sources,
      };

      roundtable.turns.push(newTurn);
      addedTurns.push(newTurn);
    }

    await roundtable.save();

    res.json({
      roundtable,
      addedTurns,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/roundtables/:id/summon — summon additional twins into an active session
exports.summonTwins = async (req, res, next) => {
  try {
    const { twinIds = [] } = req.body;
    if (!Array.isArray(twinIds) || twinIds.length === 0) {
      return res.status(400).json({ message: 'Please provide twin IDs to summon.' });
    }

    const roundtable = await Roundtable.findById(req.params.id);
    if (!roundtable) return res.status(404).json({ message: 'Roundtable session not found.' });

    const validTwins = await checkTwinAccess(twinIds, req.user);
    const existingIds = new Set(roundtable.twins.map((t) => t.toString()));

    const newlyAdded = [];
    for (const twin of validTwins) {
      if (!existingIds.has(twin._id.toString())) {
        roundtable.twins.push(twin._id);
        existingIds.add(twin._id.toString());
        newlyAdded.push(twin);
      }
    }

    if (newlyAdded.length > 0) {
      // Announce newly summoned twin in discussion
      roundtable.turns.push({
        turnNumber: roundtable.turns.length + 1,
        round: Math.floor(roundtable.turns.filter((t) => t.speakerRole === 'twin').length / Math.max(1, roundtable.twins.length)) + 1,
        speakerRole: 'moderator',
        speakerName: 'System Moderator',
        speakerTitle: 'Roundtable Facilitator',
        speakerAvatarInitials: 'MOD',
        speakerDept: 'System',
        content: `**${newlyAdded.map((t) => `${t.name} (${t.title}, ${t.dept})`).join(' and ')}** ${newlyAdded.length === 1 ? 'has' : 'have'} been summoned into the roundtable to join the discussion.`,
        perspective: 'Participant Summoned',
      });
    }

    await roundtable.save();

    const populated = await Roundtable.findById(roundtable._id)
      .populate('twins', 'name title avatarInitials dept organization bio tagline expertise communicationStyle thinkingPatterns')
      .populate('userId', 'name email title dept');

    res.json({ roundtable: populated, newlyAdded });
  } catch (err) {
    next(err);
  }
};

// POST /api/roundtables/:id/summarize — generate consensus and action blueprint
exports.summarize = async (req, res, next) => {
  try {
    const roundtable = await Roundtable.findById(req.params.id).populate('twins');
    if (!roundtable) return res.status(404).json({ message: 'Roundtable session not found.' });

    const summaryResult = await generateRoundtableSummary({
      roundtable,
      allTwins: roundtable.twins,
    });

    roundtable.summary = summaryResult;
    roundtable.status = 'completed';
    await roundtable.save();

    res.json({
      summary: roundtable.summary,
      roundtable,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/roundtables/:id — delete roundtable
exports.deleteRoundtable = async (req, res, next) => {
  try {
    const roundtable = await Roundtable.findById(req.params.id);
    if (!roundtable) return res.status(404).json({ message: 'Roundtable session not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && roundtable.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Roundtable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Roundtable session deleted.' });
  } catch (err) {
    next(err);
  }
};
