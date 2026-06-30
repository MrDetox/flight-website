// Cloudflare Pages Function: server-side proxy for /api/*.
// The browser calls /api/search/bonus (same origin); this forwards to the flight
// API with the Bearer key injected from the encrypted API_KEY env var. The key
// never reaches the client. SSE streams through because we return resp.body directly.
const DEFAULT_ORIGIN = 'https://46-224-73-195.sslip.io';

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const search = new URL(request.url).search;
  const target = `${env.API_ORIGIN || DEFAULT_ORIGIN}/${path}${search}`;

  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${env.API_KEY}`);
  headers.delete('host'); // let fetch set the upstream host

  const init = { method: request.method, headers };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text(); // bodies are small JSON; avoids stream-duplex issues
  }

  const resp = await fetch(target, init);
  // Pass through untouched so text/event-stream streams live to the browser.
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
}
