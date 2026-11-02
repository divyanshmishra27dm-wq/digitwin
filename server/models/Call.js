const mongoose = require('mongoose');

const callTurnSchema = new mongoose.Schema(
  {
    turnNumber: { type: Number, default: 1 },
    speakerRole: { type: String, enum: ['user', 'twin'], required: true },
    twinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Twin' },
    speakerName: { type: String, required: true },
    speakerTitle: { type: String, default: '' },
    speakerAvatarInitials: { type: String, default: '' },
    speakerDept: { type: String, default: '' },
    content: { type: String, required: true }, // full markdown transcript
    spokenText: { type: String, required: true }, // natural conversational speech for TTS
    perspective: { type: String, default: '' },
    addressedTo: [{ type: String }],
    questionTarget: { type: String, default: null }, // 'user', specific twin name, or null
    directQuestion: { type: String, default: null }, // question text if asking user/peer
    isDebateChallenge: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const callActionItemSchema = new mongoose.Schema(
  {
    task: { type: String, required: true },
    owner: { type: String, default: 'Team' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  },
  { _id: false }
);

const callSummarySchema = new mongoose.Schema(
  {
    overview: { type: String, default: '' },
    consensus: { type: String, default: '' },
    actionItems: [callActionItemSchema],
    keyDecisions: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const callSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    mode: {
      type: String,
      enum: ['team_call', 'debate', 'briefing'],
      default: 'team_call',
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    twins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Twin', required: true }],
    turns: [callTurnSchema],
    summary: callSummarySchema,
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Call', callSchema);
