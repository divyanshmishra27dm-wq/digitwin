const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const Twin = require('../models/Twin');

/**
 * Controller for Admin API Access Key Management & Model Allocation
 */

// GET /api/api-keys — List all API keys
exports.listApiKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find()
      .populate('twins', '_id name title dept avatarInitials status visibility')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const masterKey = process.env.SHARED_ACCESS_KEY || 'ndt_twin_access_key_99';
    const totalPublishedTwins = await Twin.countDocuments({ status: 'published' });

    res.json({
      keys,
      masterKey: {
        name: 'Master Environment Key (All Models)',
        key: masterKey,
        isUniversal: true,
        allocatedCount: totalPublishedTwins,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/api-keys — Create new API key with manually assigned models
exports.createApiKey = async (req, res, next) => {
  try {
    const { name, description, twinIds = [], customKey, expiresAt } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'API Key name is required.' });
    }

    // Auto-generate secure random key if custom key is not supplied
    let keyString = customKey ? customKey.trim() : null;
    if (!keyString) {
      keyString = `ndt_${crypto.randomBytes(16).toString('hex')}`;
    }

    // Check collision
    const existing = await ApiKey.findOne({ key: keyString });
    if (existing) {
      return res.status(409).json({ message: 'An API Key with this key value already exists. Please choose a different key.' });
    }

    // Verify assigned twin IDs exist
    let validTwinIds = [];
    if (Array.isArray(twinIds) && twinIds.length > 0) {
      const verifiedTwins = await Twin.find({ _id: { $in: twinIds } }).select('_id');
      validTwinIds = verifiedTwins.map((t) => t._id);
    }

    const apiKey = await ApiKey.create({
      name: name.trim(),
      description: (description || '').trim(),
      key: keyString,
      twins: validTwinIds,
      status: 'active',
      createdBy: req.user?._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    const populated = await ApiKey.findById(apiKey._id)
      .populate('twins', '_id name title dept avatarInitials status')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: `API Key "${populated.name}" successfully created with ${validTwinIds.length} allocated models.`,
      apiKey: populated,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/api-keys/:id — Get details of a single API key
exports.getApiKey = async (req, res, next) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id)
      .populate('twins', '_id name title dept avatarInitials status expertise visibility')
      .populate('createdBy', 'name email');

    if (!apiKey) {
      return res.status(404).json({ message: 'API Key not found.' });
    }

    res.json({ apiKey });
  } catch (err) {
    next(err);
  }
};

// PUT /api/api-keys/:id — Update key name, description, assigned twins, or status
exports.updateApiKey = async (req, res, next) => {
  try {
    const { name, description, twinIds, status, expiresAt } = req.body;
    const apiKey = await ApiKey.findById(req.params.id);

    if (!apiKey) {
      return res.status(404).json({ message: 'API Key not found.' });
    }

    if (name !== undefined) apiKey.name = name.trim();
    if (description !== undefined) apiKey.description = description.trim();
    if (status !== undefined && ['active', 'revoked'].includes(status)) {
      apiKey.status = status;
    }
    if (expiresAt !== undefined) {
      apiKey.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (Array.isArray(twinIds)) {
      const verifiedTwins = await Twin.find({ _id: { $in: twinIds } }).select('_id');
      apiKey.twins = verifiedTwins.map((t) => t._id);
    }

    await apiKey.save();

    const updated = await ApiKey.findById(apiKey._id)
      .populate('twins', '_id name title dept avatarInitials status')
      .populate('createdBy', 'name email');

    res.json({
      message: `API Key "${updated.name}" updated successfully.`,
      apiKey: updated,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/api-keys/:id — Delete an API key
exports.deleteApiKey = async (req, res, next) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ message: 'API Key not found.' });
    }

    await ApiKey.findByIdAndDelete(req.params.id);
    res.json({ message: `API Key "${apiKey.name}" has been permanently deleted.` });
  } catch (err) {
    next(err);
  }
};

// POST /api/api-keys/:id/regenerate — Generate a fresh key token preserving allocations
exports.regenerateKey = async (req, res, next) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);
    if (!apiKey) {
      return res.status(404).json({ message: 'API Key not found.' });
    }

    const newKey = `ndt_${crypto.randomBytes(16).toString('hex')}`;
    apiKey.key = newKey;
    apiKey.usageCount = 0;
    apiKey.lastUsedAt = null;
    await apiKey.save();

    res.json({
      message: `Fresh key token generated for "${apiKey.name}".`,
      apiKey,
      newKey,
    });
  } catch (err) {
    next(err);
  }
};
