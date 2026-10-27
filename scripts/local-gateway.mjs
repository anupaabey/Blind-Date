// Local-only Supabase-compatible gateway. Hosted Supabase uses its managed gateway.
import http from 'node:http';
const upstreams = { '/auth/v1': 54325, '/rest/v1': 54326, '/storage/v1': 54327 };
http
  .createServer((req, res) => {
    const prefix = Object.keys(upstreams).find((p) => req.url === p || req.url.startsWith(p + '/'));
    if (!prefix) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const headers = { ...req.headers, host: `127.0.0.1:${upstreams[prefix]}` };
    if (prefix === '/rest/v1' && !headers.authorization)
      headers.authorization = `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
    const target = http.request(
      {
        hostname: '127.0.0.1',
        port: upstreams[prefix],
        path: req.url.slice(prefix.length) || '/',
        method: req.method,
        headers,
      },
      (r) => {
        res.writeHead(r.statusCode ?? 502, r.headers);
        r.pipe(res);
      },
    );
    target.on('error', () => {
      res.writeHead(502);
      res.end('Local service unavailable');
    });
    req.pipe(target);
  })
  .listen(54321, '127.0.0.1', () => console.log('Local API gateway listening on port 54321.'));
