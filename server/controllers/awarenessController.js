const awarenessService = require('../services/awarenessService');
const AwarenessLog = require('../models/AwarenessLog');
const Knowledge = require('../models/Knowledge');
const Twin = require('../models/Twin');

/**
 * 1. Ingest a manual web link for a Digital Twin
 */
exports.ingestWebLink = async (req, res, next) => {
  try {
    const { twinId, url, customNotes } = req.body;

    if (!twinId || !url) {
      return res.status(400).json({ message: 'twinId and url are required.' });
    }

    const twin = await Twin.findById(twinId);
    if (!twin) {
      return res.status(404).json({ message: 'Digital Twin not found.' });
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = twin.createdBy?.toString() === req.user._id?.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to add knowledge to this Twin.' });
    }

    const result = await awarenessService.ingestManualWebLink({
      twinId,
      url,
      userId: req.user._id,
      customNotes,
    });

    res.status(201).json({
      message: `Twin "${twin.name}" successfully learned from web link!`,
      knowledge: result.knowledge,
      newlyAddedSkills: result.newlyAddedSkills,
      analysis: result.analysis,
      twin: result.twin,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Trigger Aware Mode across all Digital Twins (Admin Only)
 */
exports.triggerAwareMode = async (req, res, next) => {
  try {
    const { targetTwinId, focusTopics } = req.body;
    const result = await awarenessService.runAwareMode({
      triggeredBy: req.user._id,
      focusTopics: focusTopics || [],
      targetTwinId,
    });

    res.json({
      message: `Aware Mode executed successfully! ${result.totalTwinsUpdated} Digital Twins synchronized with ${result.topicsDiscovered.length} breakthrough AI topics.`,
      result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Get Awareness Feed (All learned technologies & web ingestions)
 */
exports.getAwarenessFeed = async (req, res, next) => {
  try {
    const { page, limit, type, twinId, search } = req.query;
    const feed = await awarenessService.getAwarenessFeed({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      type,
      twinId,
      search,
    });

    res.json(feed);
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Get Technology Awareness Stats
 */
exports.getAwarenessStats = async (req, res, next) => {
  try {
    const stats = await awarenessService.getAwarenessStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Get Aware Mode Logs (Admin Only)
 */
exports.getAwarenessLogs = async (req, res, next) => {
  try {
    const logs = await AwarenessLog.find()
      .populate('triggeredBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Delete an Awareness Knowledge Entry
 */
exports.deleteAwarenessEntry = async (req, res, next) => {
  try {
    const entry = await Knowledge.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Knowledge entry not found.' });
    }

    const twin = await Twin.findById(entry.twinId);
    const isAdmin = req.user?.role === 'admin';
    const isOwner = twin?.createdBy?.toString() === req.user._id?.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to delete this entry.' });
    }

    await Knowledge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Awareness knowledge entry removed.' });
  } catch (err) {
    next(err);
  }
};
