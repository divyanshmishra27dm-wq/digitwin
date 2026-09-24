const mongoose = require('mongoose');

const twinSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    organization: { type: String, default: 'NIIT Ltd.' },
    bio: { type: String, default: '' },
    tagline: { type: String, default: '' },
    avatarInitials: { type: String, default: '' },
    avatar: { type: String, default: '' },

    status: {
      type: String,
      enum: ['draft', 'published', 'unpublished', 'archived'],
      default: 'draft',
    },

    expertise: [{ type: String, trim: true }],

    communicationStyle: [{ type: String, trim: true }],
    thinkingPatterns: [{ type: String, trim: true }],
    responseLength: { type: String, enum: ['concise', 'balanced', 'detailed'], default: 'balanced' },

    titlePersonas: [
      {
        targetTitle: { type: String, required: true, trim: true },
        communicationStyle: [{ type: String, trim: true }],
        thinkingPatterns: [{ type: String, trim: true }],
        responseLength: { type: String, enum: ['concise', 'balanced', 'detailed'], default: 'balanced' },
        toneGuidance: { type: String, default: '' },
      },
    ],

    doNotClaim: [{ type: String, trim: true }],

    education: [
      {
        institution: { type: String, default: '' },
        degree: { type: String, default: '' },
        year: { type: String, default: '' },
        details: { type: String, default: '' },
      },
    ],

    experience: [
      {
        company: { type: String, default: '' },
        role: { type: String, default: '' },
        duration: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],

    cvFileName: { type: String, default: '' },
    cvParsedAt: { type: Date },

    systemInstructions: { type: String, default: '' },

    dept: { type: String, default: 'Engineering', trim: true },
    visibility: {
      type: String,
      enum: ['department', 'all'],
      default: 'department',
    },
    globalAccessRequest: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      requestedAt: { type: Date },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: { type: String, default: '' },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Twin', twinSchema);
