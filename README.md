# Interview Prep Buddy

Interview Prep Buddy matches a resume to a job description, creates a role-aware question bank, and scores spoken or typed practice answers. Question generation runs in Ollama on each visitor's own device; the app does not use a hosted inference service.

## Requirements

- Node.js (only needed to run the local static development server)
- [Ollama](https://ollama.com/) installed on the device running the browser
- The `llama3.1:8b` model

Download the model in a terminal:

```sh
ollama pull llama3.1:8b
```

Keep Ollama running while using the app. The app connects from the browser directly to `http://localhost:11434`; resume and job-description text are not sent to this project's web server.

## Run locally

1. Install Ollama and download the model as above.
2. Allow the local app origin in Ollama's `OLLAMA_ORIGINS` setting. For the development URL below, add `http://localhost:3000`.
3. Start the static development server:

   ```sh
   node dev-server.js
   ```

4. Open <http://localhost:3000>.

Ollama's default API listens only on the local machine, which is what this app expects. Do not expose port `11434` to the public internet. For platform-specific environment-variable instructions, see [Ollama's FAQ](https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama).

## Deploy as a static website

The site has no build step or server-side inference API. Deploy the repository's static files (`index.html`, `app.js`, and `styles.css`) to Vercel, GitHub Pages, or another static host. Visitors must install Ollama and download the model themselves.

For the deployed site, each visitor must allow the site's exact origin in their Ollama `OLLAMA_ORIGINS` setting and restart Ollama. For example, for a Vercel URL, allow `https://your-project.vercel.app` (or your custom domain). Do not use a wildcard origin for a public website. Ollama origin settings are configured on the visitor's device, not as a Vercel environment variable. Depending on the browser, the visitor may also need to approve a prompt allowing the site to connect to local applications.

On Windows, one way to set the origin is to open PowerShell and run:

```powershell
setx OLLAMA_ORIGINS "https://your-project.vercel.app"
```

Replace the example with the exact site origin, fully quit Ollama from the system tray, then start Ollama again. If `OLLAMA_ORIGINS` already has values, add the site origin to the existing list instead of replacing it. The deployment's Vercel preview URLs are different origins; use a stable production URL or add the exact preview origin when needed.

## Privacy and scoring disclosure

- Resume documents are parsed in the browser. Resume text and the pasted job description are sent directly from the browser to Ollama at `localhost` for question generation.
- This project's website server does not receive, store, or proxy that interview context. A visitor's own Ollama installation processes it locally.
- Do not use a remote Ollama endpoint if you want data to remain on the visitor's device.
- Answer scoring is a transparent, rule-based coaching rubric; it is not a hiring assessment.
- PDF.js and Mammoth are loaded from public CDNs to parse PDF and DOCX files in the browser.

## Features and accessibility

- Resume upload: `.doc`, `.docx`, and `.pdf`
- Skill matching, practice focus areas, interview question bank, and follow-up questions
- Browser speech playback and speech recognition where supported
- Keyboard navigation, visible focus states, labelled controls, live status and error messages, responsive layout, and reduced-motion support

Legacy `.doc` extraction can vary by file encoding; if text quality is poor, save the resume as `.docx` or `.pdf` and retry.
