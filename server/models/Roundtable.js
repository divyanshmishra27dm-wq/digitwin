const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema(
  {
    turnNumber: { type: Number, default: 1 },
    round: { type: Number, default: 1 },
    speakerRole: { type: String, enum: ['user', 'twin', 'moderator'], required: true },
    twinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Twin' },
    speakerName: { type: String, required: true },
    speakerTitle: { type: String, default: '' },
    speakerAvatarInitials: { type: String, default: '' },
    speakerDept: { type: String, default: '' },
    content: { type: String, required: true },
    perspective: { type: String, default: '' },
    addressedTo: [{ type: String }],
    keyTakeaway: { type: String, default: '' },
    sources: [{ title: String }],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const actionPlanItemSchema = new mongoose.Schema(
  {
    step: { type: Number, required: true },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    owner: { type: String, default: 'Cross-functional Team' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'High' },
  },
  { _id: false }
);

const perspectiveItemSchema = new mongoose.Schema(
  {
    twinName: { type: String, required: true },
    twinTitle: { type: String, default: '' },
    summary: { type: String, required: true },
    keyPoints: [{ type: String }],
  },
  { _id: false }
);

const summarySchema = new mongoose.Schema(
  {
    overview: { type: String, default: '' },
    consensus: { type: String, default: '' },
    perspectives: [perspectiveItemSchema],
    actionPlan: [actionPlanItemSchema],
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roundtableSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    discussionMode: {
      type: String,
      enum: ['problem_solving', 'architecture', 'strategy', 'debate', 'brainstorm'],
      default: 'problem_solving',
    },
    twins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Twin', required: true }],
    turns: [turnSchema],
    summary: summarySchema,
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roundtable', roundtableSchema);
