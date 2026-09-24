const Escalation = require('../models/Escalation');
const Knowledge = require('../models/Knowledge');

exports.createEscalation = async (req, res, next) => {
  try {
    const { twinId, conversationId, question, reason, aiResponse } = req.body;
    if (!twinId || !question) {
      return res.status(400).json({ message: 'twinId and question are required.' });
    }

    const escalation = await Escalation.create({
      userId: req.user._id,
      twinId,
      conversationId,
      question,
      reason: reason || '',
      aiResponse: aiResponse || '',
      status: 'pending',
    });

    res.status(201).json({ escalation });
  } catch (err) {
    next(err);
  }
};

// Admin only
exports.listEscalations = async (req, res, next) => {
  try {
    const escalations = await Escalation.find({})
      .populate('userId', 'name email')
      .populate('twinId', 'name title')
      .populate('knowledgeId')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ escalations });
  } catch (err) {
    next(err);
  }
};

exports.updateEscalation = async (req, res, next) => {
  try {
    const allowed = ['status', 'adminNotes', 'expertAnswer'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const escalation = await Escalation.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('userId', 'name email')
      .populate('twinId', 'name title')
      .populate('knowledgeId');
    if (!escalation) return res.status(404).json({ message: 'Escalation not found.' });
    res.json({ escalation });
  } catch (err) {
    next(err);
  }
};

exports.answerEscalation = async (req, res, next) => {
  try {
    const { title, category, summary, content, tags, expertAnswer, addToKnowledge = true } = req.body;
    const escalation = await Escalation.findById(req.params.id);
    if (!escalation) return res.status(404).json({ message: 'Escalation not found.' });

    const answerText = (content || expertAnswer || '').trim();
    if (!answerText) {
      return res.status(400).json({ message: 'Answer content is required.' });
    }

    let knowledgeEntry = null;
    if (addToKnowledge) {
      const parsedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Human Verified', 'Escalation Answer'];

      knowledgeEntry = await Knowledge.create({
        twinId: escalation.twinId,
        title: (title || escalation.question).trim(),
        category: (category || 'Experience').trim(),
        summary: (summary || answerText.slice(0, 160)).trim(),
        content: answerText,
        tags: parsedTags.length > 0 ? parsedTags : ['Human Verified', 'Escalation Answer'],
        source: 'Twin Owner / Expert Escalation Answer',
        sourceType: 'expert_response',
      });
    }

    escalation.status = 'responded';
    escalation.expertAnswer = answerText;
    if (knowledgeEntry) {
      escalation.knowledgeId = knowledgeEntry._id;
    }
    escalation.respondedAt = new Date();
    await escalation.save();

    const populated = await Escalation.findById(escalation._id)
      .populate('userId', 'name email')
      .populate('twinId', 'name title')
      .populate('knowledgeId')
      .lean();

    res.json({
      escalation: populated,
      knowledge: knowledgeEntry,
      message: 'Escalation answered and Digital Twin trained with new knowledge.',
    });
  } catch (err) {
    next(err);
  }
};

