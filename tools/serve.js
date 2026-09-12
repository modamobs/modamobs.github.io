/* ===================================================
   로컬 정적 서버 (Node 기본 모듈만 사용 — 설치할 것 없음)
   ---------------------------------------------------
   tools\serve.bat 이 이 파일을 실행합니다.
   사이트 폴더(= 이 파일의 상위 폴더)를 http://localhost:8000/ 로 띄웁니다.

   직접 실행하려면:  node tools/serve.js [포트]
   =================================================== */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.mp4':  'video/mp4',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.unityweb': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch (e) {
    res.writeHead(400); res.end('Bad request'); return;
  }

  /* 사이트 폴더 밖으로 나가는 요청은 막습니다. */
  let file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      /* /play/ 처럼 폴더로 들어오면 그 안의 index.html 을 줍니다. */
      file = path.join(file, 'index.html');
    }

    fs.readFile(file, (err2, buf) => {
      if (err2) {
        console.log('404', pathname);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404</h1><p>' + pathname + ' 없음</p><p><a href="/">홈으로</a></p>');
        return;
      }
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'no-store'          /* 개발 중이니 항상 최신 파일 */
      });
      res.end(buf);
    });
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('');
    console.log('  Port ' + PORT + ' is already in use.');
    console.log('  Another server may already be running: http://localhost:' + PORT + '/');
  } else {
    console.log(e.message);
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  root : ' + ROOT);
  console.log('  open : http://localhost:' + PORT + '/');
  console.log('  play : http://localhost:' + PORT + '/play/?g=sudoku');
  console.log('');
  console.log('  Ctrl+C to stop.');
  console.log('');
});
