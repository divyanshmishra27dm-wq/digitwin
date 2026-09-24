const Twin = require('../models/Twin');
const Knowledge = require('../models/Knowledge');
const Conversation = require('../models/Conversation');
const { parseCVDocument } = require('../services/cvParserService');
const { ingestDocumentForTwin } = require('../services/ragService');

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// POST /api/twins/parse-cv — parses uploaded CV/Resume document and returns structured pretext
exports.parseCV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CV/Resume file provided. Please upload a PDF, Word (DOCX), or Text file.' });
    }

    const parsed = await parseCVDocument(req.file);
    res.json({
      message: 'CV successfully parsed and analyzed.',
      parsed,
    });
  } catch (err) {
    console.error('[twinController.parseCV] Error:', err.message);
    res.status(400).json({ message: err.message || 'Failed to parse CV document.' });
  }
};

// POST /api/twins/:id/documents — uploads and ingests document(s) directly into Twin RAG knowledge
exports.uploadTwinDocuments = async (req, res, next) => {
  try {
    const twin = await Twin.findById(req.params.id);
    if (!twin) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = twin.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to upload documents for this Digital Twin.' });
    }

    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) {
      return res.status(400).json({ message: 'No documents provided for upload.' });
    }

    const results = [];
    let totalCreated = 0;

    for (const file of files) {
      const result = await ingestDocumentForTwin(twin._id, file);
      results.push(result);
      totalCreated += result.count;
    }

    const allKnowledge = await Knowledge.find({ twinId: twin._id }).sort({ createdAt: -1 });

    res.status(201).json({
      message: `Successfully processed ${files.length} document(s) and ingested ${totalCreated} knowledge records into RAG knowledge base.`,
      results,
      knowledge: allKnowledge,
    });
  } catch (err) {
    console.error('[twinController.uploadTwinDocuments] Error:', err.message);
    res.status(400).json({ message: err.message || 'Failed to process and ingest documents.' });
  }
};

// GET /api/twins — regular users see only their department's published twins or global twins; admins see all
exports.listTwins = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    let filter = {};

    if (!isAdmin) {
      const userDept = req.user?.dept || 'Engineering';
      filter = {
        status: 'published',
        $or: [
          { visibility: 'all' },
          { dept: userDept },
          { createdBy: req.user?._id },
        ],
      };
    }

    const twins = await Twin.find(filter)
      .populate('createdBy', 'name email dept')
      .populate('globalAccessRequest.requestedBy', 'name email dept')
      .sort({ updatedAt: -1 })
      .lean();

    const withCounts = await Promise.all(
      twins.map(async (twin) => {
        const [knowledgeCount, conversationCount] = await Promise.all([
          Knowledge.countDocuments({ twinId: twin._id }),
          Conversation.countDocuments({ twinId: twin._id }),
        ]);
        return { ...twin, knowledgeCount, conversationCount };
      })
    );

    res.json({ twins: withCounts });
  } catch (err) {
    next(err);
  }
};

exports.getTwin = async (req, res, next) => {
  try {
    const twin = await Twin.findById(req.params.id)
      .populate('createdBy', 'name email dept')
      .populate('globalAccessRequest.requestedBy', 'name email dept')
      .populate('globalAccessRequest.reviewedBy', 'name email dept')
      .lean();

    if (!twin) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      if (twin.status !== 'published' && twin.createdBy?._id?.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Digital Twin not found.' });
      }

      const userDept = req.user?.dept || 'Engineering';
      const isSameDept = twin.dept === userDept;
      const isGlobal = twin.visibility === 'all';
      const isCreator = twin.createdBy?._id?.toString() === req.user._id.toString();

      if (!isGlobal && !isSameDept && !isCreator) {
        return res.status(403).json({
          message: `This Digital Twin belongs to the "${twin.dept}" department and is not available to the "${userDept}" department.`,
        });
      }
    }

    const knowledgeCount = await Knowledge.countDocuments({ twinId: twin._id });
    res.json({ twin: { ...twin, knowledgeCount } });
  } catch (err) {
    next(err);
  }
};

exports.createTwin = async (req, res, next) => {
  try {
    const {
      name,
      title,
      organization,
      bio,
      tagline,
      dept,
      visibility,
      expertise,
      communicationStyle,
      thinkingPatterns,
      responseLength,
      titlePersonas,
      doNotClaim,
      education,
      experience,
      cvFileName,
      initialProjects, // optional array of projects to immediately save as Knowledge
    } = req.body;

    if (!name || !title) {
      return res.status(400).json({ message: 'Name and title are required.' });
    }

    const isAdmin = req.user?.role === 'admin';
    const userDept = req.user?.dept || 'Engineering';

    const twin = await Twin.create({
      name,
      title,
      organization: organization || 'NIIT Ltd.',
      bio: bio || '',
      tagline: tagline || '',
      dept: dept && dept.trim() ? dept.trim() : userDept,
      visibility: isAdmin && visibility === 'all' ? 'all' : 'department',
      avatarInitials: initials(name),
      createdBy: req.user._id,
      status: 'draft',
      expertise: Array.isArray(expertise) ? expertise : [],
      communicationStyle: Array.isArray(communicationStyle) ? communicationStyle : [],
      thinkingPatterns: Array.isArray(thinkingPatterns) ? thinkingPatterns : [],
      responseLength: responseLength || 'balanced',
      titlePersonas: Array.isArray(titlePersonas) ? titlePersonas : [],
      doNotClaim: Array.isArray(doNotClaim) ? doNotClaim : [],
      education: Array.isArray(education) ? education : [],
      experience: Array.isArray(experience) ? experience : [],
      cvFileName: cvFileName || '',
      cvParsedAt: cvFileName ? new Date() : undefined,
    });

    // If initial projects were provided from CV parse, save them as Knowledge entries
    if (Array.isArray(initialProjects) && initialProjects.length > 0) {
      for (const p of initialProjects) {
        if (p.title && (p.content || p.summary)) {
          await Knowledge.create({
            twinId: twin._id,
            title: p.title,
            category: p.category || 'Project',
            summary: p.summary || p.title,
            content: p.content || p.summary,
            tags: Array.isArray(p.tags) ? p.tags : [],
            source: p.source || cvFileName || 'CV Upload',
            sourceType: p.sourceType || 'cv_upload',
          });
        }
      }
    }

    res.status(201).json({ twin });
  } catch (err) {
    next(err);
  }
};

exports.updateTwin = async (req, res, next) => {
  try {
    const existing = await Twin.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = existing.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to modify this Digital Twin.' });
    }

    const allowedFields = [
      'name', 'title', 'organization', 'bio', 'tagline', 'avatar',
      'dept', 'visibility',
      'expertise', 'communicationStyle', 'thinkingPatterns', 'responseLength',
      'titlePersonas', 'doNotClaim', 'systemInstructions',
      'education', 'experience', 'cvFileName'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (updates.name) updates.avatarInitials = initials(updates.name);

    // If user is not admin, they cannot directly set visibility to 'all'
    if (!isAdmin && updates.visibility === 'all') {
      delete updates.visibility;
    }

    const twin = await Twin.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ twin });
  } catch (err) {
    next(err);
  }
};

exports.deleteTwin = async (req, res, next) => {
  try {
    const existing = await Twin.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = existing.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to delete this Digital Twin.' });
    }

    await Twin.findByIdAndDelete(req.params.id);
    await Knowledge.deleteMany({ twinId: req.params.id });
    res.json({ message: 'Digital Twin deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.publishTwin = async (req, res, next) => {
  try {
    const existing = await Twin.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = existing.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to publish this Digital Twin.' });
    }

    existing.status = 'published';
    existing.publishedAt = new Date();
    await existing.save();

    res.json({ twin: existing });
  } catch (err) {
    next(err);
  }
};

exports.unpublishTwin = async (req, res, next) => {
  try {
    const existing = await Twin.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Digital Twin not found.' });

    const isAdmin = req.user?.role === 'admin';
    const isOwner = existing.createdBy?.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to unpublish this Digital Twin.' });
    }

    existing.status = 'unpublished';
    await existing.save();

    res.json({ twin: existing });
  } catch (err) {
    next(err);
  }
};

// POST /api/twins/:id/request-global — raise request to make twin available to all departments
exports.requestGlobalAccess = async (req, res, next) => {
  try {
    const twin = await Twin.findById(req.params.id);
    if (!twin) return res.status(404).json({ message: 'Digital Twin not found.' });

    if (twin.visibility === 'all') {
      return res.status(400).json({ message: 'This Digital Twin is already available to all departments.' });
    }

    twin.globalAccessRequest = {
      status: 'pending',
      requestedAt: new Date(),
      requestedBy: req.user._id,
      rejectionReason: '',
    };

    await twin.save();
    res.json({ twin, message: 'Global access request submitted for Administrator review.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/twins/:id/review-global — admin approves or rejects global access request
exports.reviewGlobalAccess = async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { action, rejectionReason } = req.body;
    const twin = await Twin.findById(req.params.id);
    if (!twin) return res.status(404).json({ message: 'Digital Twin not found.' });

    if (action === 'approve') {
      twin.visibility = 'all';
      twin.globalAccessRequest = {
        status: 'approved',
        requestedAt: twin.globalAccessRequest?.requestedAt || new Date(),
        requestedBy: twin.globalAccessRequest?.requestedBy || req.user._id,
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
        rejectionReason: '',
      };
    } else if (action === 'reject') {
      twin.globalAccessRequest = {
        status: 'rejected',
        requestedAt: twin.globalAccessRequest?.requestedAt || new Date(),
        requestedBy: twin.globalAccessRequest?.requestedBy || req.user._id,
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
        rejectionReason: rejectionReason || 'Request was not approved.',
      };
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject".' });
    }

    await twin.save();
    res.json({
      twin,
      message: action === 'approve'
        ? 'Digital Twin is now available across ALL departments.'
        : 'Global access request was rejected.',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/twins/global-requests — admin lists all pending global access requests
exports.listGlobalRequests = async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const requests = await Twin.find({ 'globalAccessRequest.status': 'pending' })
      .populate('createdBy', 'name email dept')
      .populate('globalAccessRequest.requestedBy', 'name email dept')
      .sort({ 'globalAccessRequest.requestedAt': -1 })
      .lean();

    res.json({ requests });
  } catch (err) {
    next(err);
  }
};
