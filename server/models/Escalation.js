const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    twinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Twin', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    question: { type: String, required: true },
    reason: { type: String, default: '' },
    aiResponse: { type: String, default: '' },
    expertAnswer: { type: String, default: '' },
    knowledgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Knowledge' },
    status: { type: String, enum: ['pending', 'reviewed', 'responded', 'closed'], default: 'pending' },
    adminNotes: { type: String, default: '' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Escalation', escalationSchema);

