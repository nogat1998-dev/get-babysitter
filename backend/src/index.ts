import { config } from './config/env';
import { startMCPServer } from './mcp/server';
import app from './app';

// Start REST API server
app.listen(config.port, () => {
  console.log(`🚀 REST API running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
});

// Start MCP server on separate port
startMCPServer(3002);

export default app;
