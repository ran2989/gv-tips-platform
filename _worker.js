// Cloudflare Worker — GV TIPS Platform
// Serves static files AND proxies GitHub API (PAT stored securely in env)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, POST, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // GitHub API proxy at /gh/* — PAT injected server-side
    if (url.pathname.startsWith('/gh/')) {
      const ghPath = url.pathname.slice(3); // /gh/repos/... → /repos/...
      const ghUrl = 'https://api.github.com' + ghPath + url.search;

      let body = undefined;
      if (request.method === 'PUT' || request.method === 'POST' || request.method === 'PATCH') {
        body = await request.text();
      }

      const resp = await fetch(ghUrl, {
        method: request.method,
        headers: {
          'Authorization': 'Bearer ' + env.GITHUB_PAT,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'GV-TIPS-Platform/1.0'
        },
        body: body
      });

      const data = await resp.text();
      return new Response(data, {
        status: resp.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Serve static files (index.html etc.) via Cloudflare Pages ASSETS
    return env.ASSETS.fetch(request);
  }
};
