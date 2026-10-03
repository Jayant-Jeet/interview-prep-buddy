const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const PUBLIC_FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "application/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]]
]);

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
  } catch (error) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  const file = PUBLIC_FILES.get(pathname);
  if (!file) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  const [filename, contentType] = file;
  fs.readFile(path.join(ROOT, filename), (error, data) => {
    if (error) {
      res.writeHead(500);
      res.end("Could not read site file");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});

server.listen(PORT, () => {
  console.log(`Interview Prep Buddy running at http://localhost:${PORT}`);
  console.log("Interview context is sent directly from the browser to Ollama on this device.");
});