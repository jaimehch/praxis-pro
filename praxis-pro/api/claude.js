// ═══════════════════════════════════════════════════════════════════
// PRAXIS Pro — Claude API Proxy
// Vercel Edge Function: la API key NUNCA llega al navegador.
// El browser solo habla con /api/claude, nunca con Anthropic directo.
// ═══════════════════════════════════════════════════════════════════
export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  // Verificar API key configurada en Vercel (variables de entorno)
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY no está configurada en Vercel. Ve a Settings → Environment Variables.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  // Parsear el body del frontend
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Body JSON inválido.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  const {
    system,
    messages,
    max_tokens  = 8096,
    temperature = 0.1,
  } = body;

  if (!system || !messages?.length) {
    return new Response(
      JSON.stringify({ error: 'Faltan campos: system y messages son obligatorios.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }
    );
  }

  // Llamar a Anthropic con streaming activado
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':          ANTHROPIC_KEY,   // La key vive aquí, en el servidor
      'anthropic-version':  '2023-06-01',
      'content-type':       'application/json',
    },
    body: JSON.stringify({
      model:       process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      max_tokens,
      temperature,
      stream:      true,
      system,
      messages,
    }),
  });

  // Si Anthropic devuelve error, pasarlo al frontend
  if (!anthropicRes.ok) {
    const errorBody = await anthropicRes.text();
    return new Response(errorBody, {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // Pass-through del stream SSE de Anthropic → browser
  // El frontend lee los tokens en tiempo real (streaming)
  return new Response(anthropicRes.body, {
    status: 200,
    headers: {
      'Content-Type':     'text/event-stream',
      'Cache-Control':    'no-cache',
      'X-Accel-Buffering':'no',
      ...CORS,
    },
  });
}
