const Twin = require('../models/Twin');
const Knowledge = require('../models/Knowledge');
const Conversation = require('../models/Conversation');
const { generateTwinResponse } = require('../services/aiService');

/**
 * GET /api/shared/twins
 * Returns digital twins allocated to the caller's API Key.
 * If the caller holds a scoped API Key, only the models assigned to that key are returned.
 * Optional query params:
 *   - ?dept=Engineering (filter by department if desired)
 *   - ?status=all (defaults to published; pass 'all' to include drafts)
 *   - ?search=keyword (search by name, title, bio, or expertise)
 */
exports.getAllSharedTwins = async (req, res, next) => {
  try {
    const { dept, status, search } = req.query;
    const apiKeyDoc = req.apiKeyDoc;

    const filter = {};

    // 1. Enforce API Key Model Allocation Boundary
    if (apiKeyDoc && !apiKeyDoc.isUniversal) {
      filter._id = { $in: apiKeyDoc.allowedTwinIds || [] };
    }

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
          interactionFrequency: twin.interactionFrequency || '',
          usualChannel: twin.usualChannel || '',
          typicalInteractions: twin.typicalInteractions || [],
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
      accessLevel: apiKeyDoc?.isUniversal
        ? 'Universal Shared Access (All Models)'
        : `Key-Allocated Access (${apiKeyDoc?.name || 'Scoped Key'})`,
      keyName: apiKeyDoc?.name || 'Shared Key',
      isScopedToKey: !(apiKeyDoc?.isUniversal),
      allocatedModelsCount: apiKeyDoc?.isUniversal ? twinsWithCounts.length : (apiKeyDoc?.allowedTwinIds?.length || 0),
      returnedCount: twinsWithCounts.length,
      departments,
      twins: twinsWithCounts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shared/twins/:id
 * Returns single digital twin by ID with all knowledge items.
 * Validates that the requested model is allocated to the caller's API key.
 */
exports.getSharedTwinById = async (req, res, next) => {
  try {
    const apiKeyDoc = req.apiKeyDoc;
    const requestedId = req.params.id;

    // Enforce API Key Model Allocation Boundary
    if (apiKeyDoc && !apiKeyDoc.isUniversal) {
      const isAllocated = (apiKeyDoc.allowedTwinIds || []).includes(requestedId);
      if (!isAllocated) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Access denied. This Digital Twin is not allocated to your API access key ("${apiKeyDoc.name}").`,
          allocatedTwinIds: apiKeyDoc.allowedTwinIds,
        });
      }
    }

    const twin = await Twin.findById(requestedId)
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
      accessLevel: apiKeyDoc?.isUniversal ? 'Universal Access' : `Allocated to ${apiKeyDoc?.name}`,
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
        interactionFrequency: twin.interactionFrequency || '',
        usualChannel: twin.usualChannel || '',
        typicalInteractions: twin.typicalInteractions || [],
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
 * Send a prompt or query to a twin using the shared key.
 * Enforces that the requested twin is allocated to the caller's API key.
 * Body: { "twinId": "...", "message": "...", "history": [...] }
 */
exports.chatSharedTwin = async (req, res, next) => {
  try {
    const { twinId, message, history = [] } = req.body;
    const apiKeyDoc = req.apiKeyDoc;

    if (!twinId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'twinId and message are required in request body.',
      });
    }

    // Enforce API Key Model Allocation Boundary
    if (apiKeyDoc && !apiKeyDoc.isUniversal) {
      const isAllocated = (apiKeyDoc.allowedTwinIds || []).includes(twinId.toString());
      if (!isAllocated) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Access denied. The Digital Twin requested is not allocated to your API access key ("${apiKeyDoc.name}").`,
        });
      }
    }

    const twin = await Twin.findById(twinId);
    if (!twin) {
      return res.status(404).json({ success: false, message: 'Digital Twin not found.' });
    }

    // Virtual user context bypassing department boundaries
    const callerContext = {
      name: apiKeyDoc?.name ? `API Client (${apiKeyDoc.name})` : 'External Evaluator / Shared User',
      dept: 'Universal Access',
      title: 'Partner',
      role: 'external',
    };

    const aiResult = await generateTwinResponse(twin, message.trim(), history, callerContext);

    res.json({
      success: true,
      apiKeyName: apiKeyDoc?.name || 'Shared Key',
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
