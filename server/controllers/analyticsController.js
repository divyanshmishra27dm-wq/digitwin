const Twin = require('../models/Twin');
const Conversation = require('../models/Conversation');
const Escalation = require('../models/Escalation');
const User = require('../models/User');

exports.getAnalytics = async (req, res, next) => {
  try {
    const [twinCount, publishedCount, conversations, escalationCount, userCount] = await Promise.all([
      Twin.countDocuments({}),
      Twin.countDocuments({ status: 'published' }),
      Conversation.find({}).lean(),
      Escalation.countDocuments({}),
      User.countDocuments({ role: 'user' }),
    ]);

    let questionsAnswered = 0;
    let insufficientInfo = 0;
    const topicCounts = {};

    for (const convo of conversations) {
      for (const msg of convo.messages) {
        if (msg.role !== 'twin') continue;
        if (msg.responseType === 'insufficient_information') {
          insufficientInfo += 1;
        } else {
          questionsAnswered += 1;
        }
        for (const src of msg.sources || []) {
          const key = src.title || 'Other';
          topicCounts[key] = (topicCounts[key] || 0) + 1;
        }
      }
    }

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count }));

    res.json({
      twinCount,
      publishedCount,
      userCount,
      conversationCount: conversations.length,
      questionsAnswered,
      insufficientInfo,
      escalationCount,
      topTopics,
    });
  } catch (err) {
    next(err);
  }
};
