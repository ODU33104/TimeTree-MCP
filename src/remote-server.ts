import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TimeTreeAuthManager } from './client/auth.js';
import { TimeTreeAPIClient } from './client/api.js';
import { registerTools, toolResult } from './tools/index.js';
import { loadRemotePolicy, authorizeRemoteRequest } from './remote/security.js';
import { isToolAllowed } from './utils/tool-access.js';

const policy = loadRemotePolicy();
const email = process.env.TIMETREE_EMAIL;
const password = process.env.TIMETREE_PASSWORD;
if (!email || !password) throw new Error('Local TimeTree credentials are required');
const host = process.env.TIMETREE_REMOTE_HOST ?? '127.0.0.1';
if (host !== '127.0.0.1' && host !== '::1') {
  throw new Error('Remote MCP binds to loopback only until deployment security review');
}
const port = Number(process.env.TIMETREE_REMOTE_PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');

function reject(res: ServerResponse, status: number): void {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ error: 'Request rejected' }));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > policy.maxBodyBytes) throw new Error('body-too-large');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const httpServer = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.url !== '/mcp') return reject(res, 404);
  const authorization = authorizeRemoteRequest({
    authorization: req.headers.authorization,
    origin: req.headers.origin,
  }, policy);
  if (authorization !== 200) return reject(res, authorization);
  if (req.method !== 'POST') return reject(res, 405);
  if (Number(req.headers['content-length'] ?? 0) > policy.maxBodyBytes) return reject(res, 413);

  let server: Server | undefined;
  try {
    const body = await readJson(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reject(res, 400);
    const auth = new TimeTreeAuthManager({ email, password });
    const api = new TimeTreeAPIClient(auth);
    const tools = registerTools(api).filter((tool) => isToolAllowed(tool.name, !policy.allowWrites));
    server = new Server({ name: 'timetree-mcp-remote', version: '0.7.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: tools.map(({ name, description, inputSchema, outputSchema, annotations }) =>
        ({ name, description, inputSchema, outputSchema, annotations })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = tools.find((entry) => entry.name === request.params.name);
      if (!tool) return { isError: true, content: [{ type: 'text' as const, text: 'Tool unavailable' }] };
      try {
        return toolResult(tool, await tool.handler(request.params.arguments));
      } catch {
        return { isError: true, content: [{ type: 'text' as const, text: 'Tool execution failed' }] };
      }
    });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => { void server?.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (error) {
    if (!res.headersSent) reject(res, error instanceof SyntaxError ? 400 : error instanceof Error && error.message === 'body-too-large' ? 413 : 500);
    await server?.close();
  }
});
httpServer.requestTimeout = 30_000;
httpServer.headersTimeout = 10_000;
httpServer.listen(port, host);
