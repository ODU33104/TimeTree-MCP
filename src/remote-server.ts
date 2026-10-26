/** Loopback-only, stateless MCP Streamable HTTP server. Never expose directly to the internet. */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TimeTreeAuthManager } from './client/auth.js';
import { TimeTreeAPIClient } from './client/api.js';
import { registerTools, toolResult } from './tools/index.js';
import { safeToolErrorResult } from './utils/mcp-errors.js';
import { authorizeRemoteRequest, isRemoteToolAllowed, loadRemotePolicy } from './remote/security.js';
import { loadCredential } from './credentials/local-vault.js';

export function assertLoopbackHost(host: string): void {
  if (host !== '127.0.0.1' && host !== '::1') throw new Error('Public bind forbidden: use loopback only');
}
export async function startRemoteServer(env: NodeJS.ProcessEnv = process.env) {
  const host = env.TIMETREE_REMOTE_HOST ?? '127.0.0.1';
  assertLoopbackHost(host);
  const policy = loadRemotePolicy(env);
  // Vault holds a JSON object with email/password, entered privately via local onboarding.
  const saved = await loadCredential();
  let credentials: unknown;
  try { credentials = JSON.parse(saved.token); } catch { throw new Error('Local credential must contain email/password JSON'); }
  if (!credentials || typeof credentials !== 'object' || !('email' in credentials) || !('password' in credentials) ||
      typeof credentials.email !== 'string' || typeof credentials.password !== 'string' ||
      !credentials.email || !credentials.password) throw new Error('Invalid local credential structure');
  const auth = new TimeTreeAuthManager({ email: credentials.email, password: credentials.password });
  const tools = registerTools(new TimeTreeAPIClient(auth));
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const respond = (status: number) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify({ error: 'Request rejected' })); };
    if (req.url !== '/mcp') return respond(404);
    if (req.method !== 'POST') return respond(405);
    const status = authorizeRemoteRequest({ authorization: req.headers.authorization, origin: req.headers.origin }, policy);
    if (status !== 200) return respond(status);
    if (Number(req.headers['content-length'] ?? 0) > policy.maxBodyBytes) return respond(413);
    let bytes = 0;
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > policy.maxBodyBytes) return respond(413);
        chunks.push(buffer);
      }
      const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const server = new Server({ name: 'timetree-mcp-loopback', version: '0.7.0' }, { capabilities: { tools: {} } });
      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: tools.filter(t => isRemoteToolAllowed(t.name, policy.allowWrites)).map(t => ({
          name: t.name, description: t.description, inputSchema: t.inputSchema, outputSchema: t.outputSchema, annotations: t.annotations,
        })),
      }));
      server.setRequestHandler(CallToolRequestSchema, async request => {
        const tool = tools.find(t => t.name === request.params.name);
        if (!tool || !isRemoteToolAllowed(request.params.name, policy.allowWrites))
          return { isError: true, content: [{ type: 'text' as const, text: 'Tool unavailable' }] };
        try { return toolResult(tool, await tool.handler(request.params.arguments)); }
        catch { return safeToolErrorResult(); }
      });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      res.once('close', () => { void server.close(); });
      await transport.handleRequest(req, res, body);
    } catch { if (!res.headersSent) respond(400); else res.destroy(); }
  });
  const port = Number(env.TIMETREE_REMOTE_PORT ?? 8787);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local port');
  await new Promise<void>((resolve, reject) => { httpServer.once('error', reject); httpServer.listen(port, host, resolve); });
  return httpServer;
}
if (process.argv[1] && /remote-server\.(?:js|ts)$/.test(process.argv[1])) {
  startRemoteServer().catch(() => { console.error('Local MCP server failed to start (details suppressed)'); process.exitCode = 1; });
}
