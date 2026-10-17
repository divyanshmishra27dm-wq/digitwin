require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { isDemoMode } = require('./services/aiService');

const authRoutes = require('./routes/auth');
const twinRoutes = require('./routes/twins');
const knowledgeRoutes = require('./routes/knowledge');
const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversations');
const escalationRoutes = require('./routes/escalations');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const roundtableRoutes = require('./routes/roundtables');
const awarenessRoutes = require('./routes/awareness');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// Basic rate limiting on chat + auth to prevent abuse
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', demoMode: isDemoMode() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/twins', twinRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roundtables', roundtableRoutes);
app.use('/api/awareness', awarenessRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] NIIT Digital Twin API running on port ${PORT}`);
      console.log(`[server] Mode: ${isDemoMode() ? 'DEMO (no LITELLM_API_KEY set)' : 'LIVE (LiteLLM)'}`);
    });
  })
  .catch((err) => {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  });
