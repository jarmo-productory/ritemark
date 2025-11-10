/**
 * Netlify Function: Client-Side Error Logging
 * Sprint 26 MVP: Enable AI agents to see browser errors
 *
 * Purpose:
 * - Receive error reports from browser
 * - Log to Netlify function logs
 * - AI agents monitor via: netlify logs:function log-client-error
 */

import type { Handler, HandlerEvent } from '@netlify/functions'

export const handler: Handler = async (event: HandlerEvent) => {
  // POST only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: 'Method Not Allowed'
    }
  }

  try {
    const errorData = JSON.parse(event.body || '{}')

    // Log error for AI agent monitoring
    console.error('[CLIENT-ERROR]', errorData)

    return {
      statusCode: 200,
      body: 'ok'
    }
  } catch (err) {
    console.error('[log-client-error] Invalid request:', err)
    return {
      statusCode: 400,
      body: 'Invalid JSON'
    }
  }
}
