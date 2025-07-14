const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        // Parse request url to handle custom routes if needed
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;

        // Handle requests to specific routes or pass to Next.js handle
        if (pathname === '/api/custom-route') {
            // Example of custom route handling
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Custom route response' }));
        } else {
            // Let Next.js handle everything else
            handle(req, res, parsedUrl);
        }
    }).listen(process.env.PORT || 3000, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${process.env.PORT || 3000}`);
    });
});