import { createServer } from 'http';
import { query } from '../db/pool';
import { config } from '../config/env';

/**
 * MCP (Model Context Protocol) Server
 * Exposes babysitter search capabilities to AI agents via JSON-RPC over stdio/HTTP.
 */

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}

const tools = [
  {
    name: 'search_babysitters',
    description: 'Search for babysitters near a given location within a specified radius',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude of the search center' },
        longitude: { type: 'number', description: 'Longitude of the search center' },
        radiusKm: { type: 'number', description: 'Search radius in kilometers', default: 10 },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'get_babysitter_profile',
    description: 'Get detailed profile information for a specific babysitter by ID',
    inputSchema: {
      type: 'object',
      properties: {
        babysitterId: { type: 'string', description: 'UUID of the babysitter' },
      },
      required: ['babysitterId'],
    },
  },
  {
    name: 'list_available_babysitters',
    description: 'List babysitters available on specific days of the week',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'array',
          items: { type: 'string' },
          description: 'Days of the week (e.g., ["Monday", "Tuesday"])',
        },
        city: { type: 'string', description: 'Optional city name to filter by' },
      },
      required: ['days'],
    },
  },
];

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_babysitters': {
      const { latitude, longitude, radiusKm = 10 } = args as { latitude: number; longitude: number; radiusKm?: number };
      const result = await query(
        `SELECT u.id, u.first_name, u.last_name, u.city,
                bp.hourly_rate, bp.experience_years, bp.rating, bp.available_days,
                ST_Distance(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
         FROM users u JOIN babysitter_profiles bp ON u.id = bp.user_id
         WHERE u.role = 'babysitter' AND u.location IS NOT NULL
           AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3 * 1000)
         ORDER BY distance_km ASC LIMIT 20`,
        [longitude, latitude, radiusKm]
      );
      return { babysitters: result.rows };
    }

    case 'get_babysitter_profile': {
      const { babysitterId } = args as { babysitterId: string };
      const result = await query(
        `SELECT u.id, u.first_name, u.last_name, u.city, u.phone,
                bp.hourly_rate, bp.experience_years, bp.bio, bp.rating,
                bp.certifications, bp.available_days, bp.total_reviews
         FROM users u JOIN babysitter_profiles bp ON u.id = bp.user_id
         WHERE u.id = $1 AND u.role = 'babysitter'`,
        [babysitterId]
      );
      if (result.rows.length === 0) return { error: 'Babysitter not found' };
      return { profile: result.rows[0] };
    }

    case 'list_available_babysitters': {
      const { days, city } = args as { days: string[]; city?: string };
      let sql = `SELECT u.id, u.first_name, u.last_name, u.city,
                        bp.hourly_rate, bp.rating, bp.available_days
                 FROM users u JOIN babysitter_profiles bp ON u.id = bp.user_id
                 WHERE u.role = 'babysitter' AND bp.available_days && $1::text[]`;
      const params: unknown[] = [days];
      if (city) {
        sql += ` AND LOWER(u.city) = LOWER($2)`;
        params.push(city);
      }
      sql += ` ORDER BY bp.rating DESC LIMIT 20`;
      const result = await query(sql, params as string[]);
      return { babysitters: result.rows };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function handleRequest(req: MCPRequest): Promise<MCPResponse> {
  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'get-babysitter-mcp', version: '1.0.0' },
          capabilities: { tools: {} },
        },
      };

    case 'tools/list':
      return { jsonrpc: '2.0', id: req.id, result: { tools } };

    case 'tools/call': {
      const { name, arguments: args } = req.params as { name: string; arguments: Record<string, unknown> };
      const result = await handleToolCall(name, args);
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
      };
    }

    default:
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: `Method not found: ${req.method}` },
      };
  }
}

// HTTP transport for MCP
export function startMCPServer(port: number = 3002) {
  const server = createServer(async (req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', async () => {
        try {
          const request: MCPRequest = JSON.parse(body);
          const response = await handleRequest(request);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }));
        }
      });
    } else {
      // Health/info endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ name: 'get-babysitter-mcp', version: '1.0.0', tools: tools.map(t => t.name) }));
    }
  });

  server.listen(port, () => {
    console.log(`🤖 MCP Server running on http://localhost:${port}`);
  });

  return server;
}
