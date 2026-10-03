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

## Run the hosted website with local Ollama

1. Install Ollama on the device running your browser and download the model:

   ```sh
   ollama pull llama3.1:8b
   ```

2. On Windows, allow the hosted website's exact origin in Ollama. In PowerShell, run:

   ```powershell
   setx OLLAMA_ORIGINS "https://www.interview-prep.online"
   ```

   If `OLLAMA_ORIGINS` already has values, add this origin to the existing list instead of replacing it.
3. Completely quit Ollama from the system tray, then start it again so the setting takes effect.
4. Visit <https://www.interview-prep.online>. When your browser asks, allow the website to connect to local applications.

## Run both the website and Ollama locally

1. Install Ollama and download the `llama3.1:8b` model as described above.
2. Allow the development site's origin in Ollama's `OLLAMA_ORIGINS` setting: `http://localhost:3000`. On Windows, add it to the existing value if one is already set, then completely quit and restart Ollama.
3. Start the static development server from the project directory:

   ```sh
   node dev-server.js
   ```

4. Open <http://localhost:3000>. If your browser asks, allow the site to connect to local applications.

Ollama's default API listens only on the local machine, which is what this app expects. Do not expose port `11434` to the public internet. For platform-specific environment-variable instructions, see [Ollama's FAQ](https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama).

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
