const mongoose = require('mongoose');

const awarenessLogSchema = new mongoose.Schema(
  {
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    triggerType: {
      type: String,
      enum: ['admin_aware_mode', 'manual_web_learning', 'scheduled'],
      default: 'admin_aware_mode',
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'running'],
      default: 'completed',
    },
    summary: { type: String, default: '' },
    topics: [
      {
        title: { type: String, required: true },
        category: { type: String, default: 'AI & Technology' },
        summary: { type: String, default: '' },
        content: { type: String, default: '' },
        sourceUrl: { type: String, default: '' },
        skillsLearned: [{ type: String }],
        tags: [{ type: String }],
        twinsUpdated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Twin' }],
      },
    ],
    totalTwinsUpdated: { type: Number, default: 0 },
    totalSkillsAcquired: { type: Number, default: 0 },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AwarenessLog', awarenessLogSchema);
