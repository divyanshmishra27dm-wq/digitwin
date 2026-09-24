const Twin = require('../models/Twin');
const Conversation = require('../models/Conversation');
const { generateTwinResponse } = require('../services/aiService');

const MAX_MESSAGE_LENGTH = 2000;

exports.sendMessage = async (req, res, next) => {
  try {
    const { twinId, conversationId, message } = req.body;

    if (!twinId || !message || !message.trim()) {
      return res.status(400).json({ message: 'twinId and message are required.' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` });
    }

    const twin = await Twin.findById(twinId);
    if (!twin) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      if (twin.status !== 'published') {
        return res.status(403).json({ message: 'This Digital Twin is not available.' });
      }
      const userDept = req.user?.dept || 'Engineering';
      const isSameDept = twin.dept === userDept;
      const isGlobal = twin.visibility === 'all';
      const isCreator = twin.createdBy?.toString() === req.user._id.toString();

      if (!isGlobal && !isSameDept && !isCreator) {
        return res.status(403).json({
          message: `This Digital Twin belongs to the "${twin.dept}" department and is not available to the "${userDept}" department.`,
        });
      }
    }

    let conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, userId: req.user._id })
      : null;

    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user._id,
        twinId,
        title: message.slice(0, 60),
        messages: [],
      });
    }

    const previousMessages = Array.isArray(conversation.messages) ? [...conversation.messages] : [];

    conversation.messages.push({ role: 'user', content: message.trim() });

    const aiResult = await generateTwinResponse(twin, message.trim(), previousMessages, req.user);

    conversation.messages.push({
      role: 'twin',
      content: aiResult.answer,
      sources: aiResult.sources,
      confidence: aiResult.confidence,
      responseType: aiResult.responseType,
      canEscalate: aiResult.canEscalate,
      suggestedOptions: aiResult.suggestedOptions || [],
      followUpQuestions: aiResult.followUpQuestions || [],
    });

    await conversation.save();

    res.json({
      conversationId: conversation._id,
      reply: aiResult,
    });
  } catch (err) {
    next(err);
  }
};

exports.listConversations = async (req, res, next) => {
  try {
    const wantsAll = req.query.all === '1' && req.user.role === 'admin';
    const filter = wantsAll ? {} : { userId: req.user._id };

    let cursor = Conversation.find(filter).populate('twinId', 'name title avatarInitials');
    if (wantsAll) cursor = cursor.populate('userId', 'name email').limit(100);

    const conversations = await cursor.sort({ updatedAt: -1 }).lean();
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('twinId', 'name title avatarInitials organization');

    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    res.json({ conversation });
  } catch (err) {
    next(err);
  }
};
