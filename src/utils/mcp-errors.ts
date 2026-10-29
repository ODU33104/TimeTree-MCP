/**
 * MCP responses are visible to AI clients and sometimes retained in chat history.
 * Never serialize raw exception messages or upstream HTTP response bodies.
 */
export function safeToolErrorResult(): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
} {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'TimeTree operation failed. Check server logs for the error category; no private diagnostics were sent to the AI client.',
    }],
  };
}
