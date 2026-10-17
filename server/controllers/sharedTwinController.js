const Twin = require('../models/Twin');
const Knowledge = require('../models/Knowledge');
const Conversation = require('../models/Conversation');
const { generateTwinResponse } = require('../services/aiService');

/**
 * GET /api/shared/twins
 * Returns all digital twins regardless of department ID.
 * Optional query params:
 *   - ?dept=Engineering (filter by department if desired)
 *   - ?status=all (defaults to published; pass 'all' to include drafts)
 *   - ?search=keyword (search by name, title, bio, or expertise)
 */
exports.getAllSharedTwins = async (req, res, next) => {
  try {
    const { dept, status, search } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    } else if (!status) {
      filter.status = 'published';
    }

    if (dept) {
      filter.dept = dept;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { title: regex },
        { bio: regex },
        { dept: regex },
        { expertise: regex },
      ];
    }

    const twins = await Twin.find(filter)
      .populate('createdBy', 'name email dept')
      .sort({ dept: 1, name: 1 })
      .lean();

    const twinsWithCounts = await Promise.all(
      twins.map(async (twin) => {
        const [knowledgeCount, conversationCount] = await Promise.all([
          Knowledge.countDocuments({ twinId: twin._id }),
          Conversation.countDocuments({ twinId: twin._id }),
        ]);
        return {
          id: twin._id,
          name: twin.name,
          title: twin.title,
          dept: twin.dept,
          organization: twin.organization || 'NIIT Ltd.',
          bio: twin.bio,
          tagline: twin.tagline,
          status: twin.status,
          visibility: twin.visibility,
          avatarInitials: twin.avatarInitials,
          expertise: twin.expertise || [],
          communicationStyle: twin.communicationStyle || [],
          thinkingPatterns: twin.thinkingPatterns || [],
          responseLength: twin.responseLength,
          titlePersonas: twin.titlePersonas || [],
          education: twin.education || [],
          experience: twin.experience || [],
          knowledgeCount,
          conversationCount,
          createdAt: twin.createdAt,
          updatedAt: twin.updatedAt,
        };
      })
    );

    const departments = [...new Set(twinsWithCounts.map((t) => t.dept))];

    res.json({
      success: true,
      accessLevel: 'Universal Shared Access (All Departments)',
      totalTwins: twinsWithCounts.length,
      departments,
      twins: twinsWithCounts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shared/twins/:id
 * Returns single digital twin by ID with all knowledge items regardless of department.
 */
exports.getSharedTwinById = async (req, res, next) => {
  try {
    const twin = await Twin.findById(req.params.id)
      .populate('createdBy', 'name email dept')
      .lean();

    if (!twin) {
      return res.status(404).json({ success: false, message: 'Digital Twin not found.' });
    }

    const [knowledgeItems, conversationCount] = await Promise.all([
      Knowledge.find({ twinId: twin._id })
        .select('title category tags summary content source createdAt')
        .lean(),
      Conversation.countDocuments({ twinId: twin._id }),
    ]);

    res.json({
      success: true,
      accessLevel: 'Universal Shared Access',
      twin: {
        id: twin._id,
        name: twin.name,
        title: twin.title,
        dept: twin.dept,
        organization: twin.organization || 'NIIT Ltd.',
        bio: twin.bio,
        tagline: twin.tagline,
        status: twin.status,
        visibility: twin.visibility,
        avatarInitials: twin.avatarInitials,
        expertise: twin.expertise || [],
        communicationStyle: twin.communicationStyle || [],
        thinkingPatterns: twin.thinkingPatterns || [],
        responseLength: twin.responseLength,
        titlePersonas: twin.titlePersonas || [],
        education: twin.education || [],
        experience: twin.experience || [],
        knowledgeCount: knowledgeItems.length,
        conversationCount,
        knowledge: knowledgeItems,
        createdAt: twin.createdAt,
        updatedAt: twin.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/shared/twins/chat
 * Send a prompt or query to any twin across any department using the shared key.
 * Body: { "twinId": "...", "message": "...", "history": [...] }
 */
exports.chatSharedTwin = async (req, res, next) => {
  try {
    const { twinId, message, history = [] } = req.body;

    if (!twinId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'twinId and message are required in request body.',
      });
    }

    const twin = await Twin.findById(twinId);
    if (!twin) {
      return res.status(404).json({ success: false, message: 'Digital Twin not found.' });
    }

    // Virtual user context bypassing department boundaries
    const callerContext = {
      name: 'External Evaluator / Shared User',
      dept: 'Universal Access',
      title: 'Partner',
      role: 'external',
    };

    const aiResult = await generateTwinResponse(twin, message.trim(), history, callerContext);

    res.json({
      success: true,
      twin: {
        id: twin._id,
        name: twin.name,
        title: twin.title,
        dept: twin.dept,
      },
      answer: aiResult.answer,
      responseType: aiResult.responseType,
      confidence: aiResult.confidence,
      sources: aiResult.sources || [],
    });
  } catch (err) {
    next(err);
  }
};
