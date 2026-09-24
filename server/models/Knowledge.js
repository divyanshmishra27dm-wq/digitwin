const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema(
  {
    twinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Twin', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    source: { type: String, default: '' },
    sourceType: {
      type: String,
      enum: ['manual', 'document', 'cv_upload', 'document_upload', 'system'],
      default: 'manual',
    },
    chunkIndex: { type: Number, default: 0 },
    embedding: [{ type: Number }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Index for fast search
knowledgeSchema.index({ twinId: 1, title: 'text', summary: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Knowledge', knowledgeSchema);
