import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import babysittersRoutes from './routes/babysitters';
import { startMCPServer } from './mcp/server';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/babysitters', babysittersRoutes);

// Start REST API server
app.listen(config.port, () => {
  console.log(`🚀 REST API running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
});

// Start MCP server on separate port
startMCPServer(3002);

export default app;
