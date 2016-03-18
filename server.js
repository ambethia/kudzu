import http from 'http';
import fs from 'fs';
import qs from 'querystring';
import ws from 'ws';
import open from 'open';
import { transformFile } from 'babel-core';
import request from 'request';
import chrome from 'chrome-cookies-secure';

const PORT = process.env.PORT || 4200;
const PATH = process.argv[2];

let session;

const httpServer = http.createServer((req, res) => {
  switch (req.url) {
    case '/client.js':
      transformFile('./client.js', (_, f) => res.end(f.code));
      break;
    case '/shameless.js':
      fs.readFile('./shameless.js', (_, f) => res.end(f));
      break;
    case '/tiyo.css':
      // Fetch current CSS from TIYO, doing this server side because of CORS restrictions in the client.
      request('https://online.theironyard.com/users/sign_in', (...args) => {
        let [,, body] = [...args];
        let [hashedFileName] = body.match(/(library\.manifest-.*\.css)/);
        res.setHeader('Content-Type', 'text/css');
        res.end(`@import url("https://online.theironyard.com/assets/web/${hashedFileName}");`);
      })
      break;
    case '/library/eval/run':
      let body = [];
      req.on('data', (chunk) => body.push(chunk)).on('end', () => {
        let data = qs.parse(Buffer.concat(body).toString());
        // make a BS request so we can grab a CSRF token
        request({
          url: 'https://online.theironyard.com',
          headers: { 'Cookie': `_learn_session=${session};` },
        }, (...args) => {
          let [,, body] = [...args];
          const [, token] = body.match(/meta name="csrf-token" content="(.*)"/);
          request({
            url: 'https://online.theironyard.com/library/eval/run',
            method: 'POST',
            headers: { 'X-CSRF-Token': token, 'Cookie': `_learn_session=${session};` },
            form: data
          }, (...args) => {
            let [,, body] = [...args];
            res.setHeader('Content-Type', 'application/json');
            res.end(body);
          });
        });
      });
      break;
    case '/favicon.ico':
      // Because, why not?
      fs.readFile('./favicon.ico', (_, f) => res.end(f));
      break;
    case '/':
      fs.readFile('./index.html', (_, f) => res.end(f));
      break;
    default:
      // TODO: Mount PATH dir to serve local image assets?
  }
});

const wsServer = new ws.Server({ server: httpServer });

wsServer.on('connection', (conn) => loadMarkdown());

const loadMarkdown = () => {
  if (session === undefined) {
    console.error('First, login to TIYO via Google Chrome.');
    process.exit(1);
  } else {
    fs.readFile(PATH, (_, f) => {
      // make another BS request so we can grab a CSRF token
      request({
        url: 'https://online.theironyard.com',
        headers: { 'Cookie': `_learn_session=${session};` },
      }, (...args) => {
        let [,, body] = [...args];
        const [, token] = body.match(/meta name="csrf-token" content="(.*)"/);
        // get the rendered Markdown
        // TODO: PR to TIYO to remove CSRF-prevention rom this endpoint
        request({
          url: 'https://online.theironyard.com/preview',
          method: 'POST',
          headers: {
            'X-CSRF-Token': token,
            'Cookie': `_learn_session=${session};`
          },
          form: { src: f },
        }, (...args) => {
          let [,, body] = [...args];
          wsServer.clients.forEach((client) => client.send(body));
        });
      });
    });
  }
}

if (PATH === undefined) {
  console.error('Usage: kudzo ./path/to/content.md');
  process.exit(1);
} else {
  fs.watch(PATH, loadMarkdown);
  httpServer.listen(PORT);
  chrome.getCookies('https://online.theironyard.com', (_, cookies) => session = cookies._learn_session);
  open(`http://localhost:${PORT}`);
}
