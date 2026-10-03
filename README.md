# Interview Prep Buddy

Interview Prep Buddy is a privacy-first mock interview app that matches your resume to a job description, builds a role-aware question bank, and scores spoken or typed answers with a transparent rubric.

## Run locally

No build step, account, or paid API key is required.

1. Install Ollama:
   - https://ollama.com/
   - Example: `ollama pull llama3.1:8b`
2. Start the app server:

```sh
node server.js
```

Then open <http://localhost:3000>.

Ollama is required for skill extraction and question bank generation. The UI shows a live Llama status indicator and disables interview generation when the model is unavailable.

## What this includes

- Open-source local AI stack approach using Ollama
- Role and skill extraction from uploaded resume (.doc/.docx/.pdf) + job description
- Optional local resume parsing with Python + spaCy/Hugging Face extraction for stronger skill and experience signals
- Frequent-question search logic driven by skill, role and experience level
- Browser voice/voice transcript flow for mock interviews
- Rule-based transparent scoring for answers

## Optional resume NLP setup

The app already includes a local Python resume parser fallback (`resume_parser.py`) that uses regex extraction and can use spaCy or Hugging Face transformers if they are available in the environment. If you want stronger entity extraction, install one of these locally:

```sh
pip install spacy
python -m spacy download en_core_web_sm
```

or

```sh
pip install transformers torch sentencepiece
```

The app will automatically use the parser when Python is available and will safely fall back to the Llama-based flow if the parsing libraries are not installed.

## Privacy and scoring disclosure

Resume file parsing (.doc/.docx/.pdf), job descriptions, transcripts, and scores are processed locally in the browser and node server. The app does not upload this data to a third-party service unless you choose to connect Ollama to a remote host.

The "AI" layer here is local open-weight inference from Ollama. Answer scoring remains transparent rule-based coaching feedback.

## Accessibility

The interface supports keyboard navigation, visible focus states, labelled controls, live status and error messages, responsive layouts, and reduced-motion preferences.

## Resume upload

- Upload supported formats: `.doc`, `.docx`, `.pdf`
- The app extracts text locally into the resume field so you can edit before starting.
- Legacy `.doc` extraction can vary by file encoding; if text quality is poor, save as `.docx` and retry.
