const Knowledge = require('../models/Knowledge');
const Twin = require('../models/Twin');

exports.listKnowledge = async (req, res, next) => {
  try {
    const twin = await Twin.findById(req.params.twinId);
    if (!twin) return res.status(404).json({ message: 'Digital Twin not found.' });

    const entries = await Knowledge.find({ twinId: req.params.twinId }).sort({ createdAt: -1 });
    res.json({ knowledge: entries });
  } catch (err) {
    next(err);
  }
};

exports.createKnowledge = async (req, res, next) => {
  try {
    const twin = await Twin.findById(req.params.twinId);
    if (!twin) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = twin.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to add knowledge to this Twin.' });
    }

    const { title, category, summary, content, tags, source, sourceType } = req.body;
    if (!title || !category || !summary || !content) {
      return res.status(400).json({ message: 'Title, category, summary and content are required.' });
    }

    const entry = await Knowledge.create({
      twinId: req.params.twinId,
      title,
      category,
      summary,
      content,
      tags: tags || [],
      source: source || '',
      sourceType: sourceType || 'document',
    });

    res.status(201).json({ knowledge: entry });
  } catch (err) {
    next(err);
  }
};

exports.updateKnowledge = async (req, res, next) => {
  try {
    const entry = await Knowledge.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Knowledge entry not found.' });

    const twin = await Twin.findById(entry.twinId);
    const isAdmin = req.user?.role === 'admin';
    const isOwner = twin?.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to edit this knowledge entry.' });
    }

    const allowed = ['title', 'category', 'summary', 'content', 'tags', 'source', 'sourceType'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = await Knowledge.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ knowledge: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteKnowledge = async (req, res, next) => {
  try {
    const entry = await Knowledge.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Knowledge entry not found.' });

    const twin = await Twin.findById(entry.twinId);
    const isAdmin = req.user?.role === 'admin';
    const isOwner = twin?.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to delete this knowledge entry.' });
    }

    await Knowledge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Knowledge entry deleted.' });
  } catch (err) {
    next(err);
  }
};
