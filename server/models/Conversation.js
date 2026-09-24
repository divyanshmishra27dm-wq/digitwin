const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'twin'], required: true },
    content: { type: String, required: true },
    sources: [
      {
        knowledgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Knowledge' },
        title: String,
      },
    ],
    confidence: { type: String, enum: ['high', 'medium', 'low'], default: undefined },
    responseType: {
      type: String,
      enum: ['documented', 'inferred', 'insufficient_information'],
      default: undefined,
    },
    canEscalate: { type: Boolean, default: false },
    suggestedOptions: [{ type: String }],
    followUpQuestions: [{ type: String }],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    twinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Twin', required: true, index: true },
    title: { type: String, default: 'New conversation' },
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
