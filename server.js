const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

function parseJsonPayload(payload) {
  try {
    return JSON.parse(payload);
  } catch (error) {
    const match = payload.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_) { return null; }
    }
    return null;
  }
}

function requestOllama(prompt) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, format: 'json' });
    const url = new URL('/api/generate', OLLAMA_URL);
    const req = http.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 11434,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let text = '';
      res.on('data', (chunk) => { text += chunk.toString(); });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          resolve(null);
          return;
        }
        try {
          const payload = JSON.parse(text);
          if (payload && payload.response) {
            resolve(parseJsonPayload(payload.response));
            return;
          }
          resolve(null);
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.setTimeout(45000, () => {
      req.destroy(new Error('Ollama request timed out after 45s'));
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

function checkOllamaStatus() {
  return new Promise((resolve) => {
    const url = new URL('/api/tags', OLLAMA_URL);
    const req = http.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 11434,
      path: url.pathname,
      method: 'GET'
    }, (res) => {
      let text = '';
      res.on('data', (chunk) => { text += chunk.toString(); });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          resolve({ connected: false, modelAvailable: false });
          return;
        }
        try {
          const payload = JSON.parse(text);
          const models = Array.isArray(payload.models) ? payload.models : [];
          const modelAvailable = models.some((model) => model && typeof model.name === 'string' && model.name.trim() === OLLAMA_MODEL);
          resolve({ connected: true, modelAvailable });
        } catch (error) {
          resolve({ connected: false, modelAvailable: false });
        }
      });
    });
    req.setTimeout(2500, () => {
      req.destroy();
      resolve({ connected: false, modelAvailable: false });
    });
    req.on('error', () => resolve({ connected: false, modelAvailable: false }));
    req.end();
  });
}

function extractResumeProfile(resumeText) {
const trimmedText = String(resumeText || '').trim();
if (!trimmedText || trimmedText.length < 20) {
  return null;
}

const pythonCandidates = ['python', 'python3'];

for (const command of pythonCandidates) {
  const result = spawnSync(command, [path.join(ROOT, 'resume_parser.py')], {
    cwd: ROOT,
    input: trimmedText,
    encoding: 'utf-8',
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  if (result.error || result.status !== 0 || !result.stdout) {
    continue;
  }

  try {
    const payload = JSON.parse(result.stdout.trim());
    if (payload && typeof payload === 'object') {
      return payload;
    }
  } catch (_) {
    // Fall through to the next option or the LLM-only path.
  }
}

return null;
}

async function generateInsights(resumeText, jobText) {
const resumeProfile = extractResumeProfile(resumeText);
const profileContext = resumeProfile
  ? `\n\nStructured resume profile (local extraction): ${JSON.stringify(resumeProfile)}`
  : '';

const ollamaPrompt = `You are creating interview prep for a candidate. 
Return valid JSON only with this schema:
{
  "role": "string",
  "experienceLevel": "junior|mid|senior",
  "matchedSkills": ["skill1", "skill2"],
  "gapSkills": ["skill3"],
  "questions": [{"category": "Behavioral|Technical|Leadership|Role fit", "text": "question text", "skill": "skill name"}]
}
Candidate resume:\n${resumeText}${profileContext}\n\nJob description:\n${jobText}`;

const llmInsights = await requestOllama(ollamaPrompt);

  if (!llmInsights || typeof llmInsights !== 'object') {
    throw new Error('Llama did not return a valid response.');
  }

  const questions = Array.isArray(llmInsights.questions)
    ? llmInsights.questions
      .map((question) => ({
        category: question?.category || 'Interview',
        text: question?.text || question?.prompt || '',
        skill: question?.skill || ''
      }))
      .filter((question) => question.text)
    : [];

  if (!questions.length) {
    throw new Error('Llama did not return interview questions.');
  }

  return {
    role: typeof llmInsights.role === 'string' ? llmInsights.role.trim() : '',
    experienceLevel: ['junior', 'mid', 'senior'].includes(llmInsights.experienceLevel) ? llmInsights.experienceLevel : 'mid',
    matchedSkills: Array.isArray(llmInsights.matchedSkills) ? llmInsights.matchedSkills : [],
    gapSkills: Array.isArray(llmInsights.gapSkills) ? llmInsights.gapSkills : [],
    questions,
    source: 'local-llm'
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(filePath, res) {
  const safePath = path.normalize(filePath).replace(/^\.+/, '');
  const resolved = path.resolve(ROOT, safePath);
  if (!resolved.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const extension = path.extname(resolved).toLowerCase();
    const typeMap = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    res.writeHead(200, { 'Content-Type': typeMap[extension] || 'application/octet-stream' });
    res.end(data);
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    const status = await checkOllamaStatus();
    sendJson(res, 200, { ok: true, model: OLLAMA_MODEL, ollamaUrl: OLLAMA_URL, connected: status.connected && status.modelAvailable });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/insights') {
    try {
      const status = await checkOllamaStatus();
      if (!status.connected || !status.modelAvailable) {
        sendJson(res, 503, { error: `Local Llama model '${OLLAMA_MODEL}' is not available.` });
        return;
      }
      const body = await parseJsonBody(req);
      const resume = body.resume || '';
      const jobDescription = body.jobDescription || '';
      const insights = await generateInsights(resume, jobDescription);
      sendJson(res, 200, insights);
    } catch (error) {
      if (error && error.message === 'Invalid JSON body') {
        sendJson(res, 400, { error: 'Invalid payload' });
        return;
      }
      sendJson(res, 502, { error: error.message || 'Failed to generate interview insights from Llama.' });
    }
    return;
  }

  let targetPath = url.pathname === '/' ? '/index.html' : url.pathname;
  if (targetPath.startsWith('/')) targetPath = targetPath.slice(1);
  serveStaticFile(targetPath, res);
});

server.listen(PORT, () => {
  console.log(`Interview Prep Buddy server running on http://localhost:${PORT}`);
});
