const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    // The specific Digital Twins manually allocated to this API Key
    twins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Twin',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
