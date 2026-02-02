# ReqAudit AI 🚀

> **Intelligent Technical Requirements Governance & Analytics Suite**

[![Deploy with Vercel](https://vercel.com/button)](https://reqaudit-ai.vercel.app)
![Static Badge](https://img.shields.io/badge/Portfolio_Demo-success)
![AI Core](https://img.shields.io/badge/AI-Gemini%20%7C%20Ollama-blue)
![Privacy](https://img.shields.io/badge/Privacy-Local--First-green)

## 🔗 [Launch Live Demo](https://reqaudit-ai.vercel.app)

**ReqAudit AI** is a specialized analytics dashboard designed for Engineering Leaders, Solution Architects, and QA Managers. It transforms unstructured technical specifications (PDF exports, emails, Wikis) into structured, queryable data.

---

## 🧠 Architecture: The Hybrid Intelligence Engine

ReqAudit AI is architected for flexibility and privacy. It supports two distinct operational modes:

### 1. ☁️ Cloud High-Fidelity (Google Gemini)
Leverages a **Cascade Strategy** for maximum performance:
*   **Tier 1:** `gemini-3-pro-preview` for deep reasoning and conflict detection.
*   **Tier 2:** `gemini-3-flash-preview` for high-speed bulk ingestion.

### 2. 🏠 Local Sovereignty (Ollama / Local LLM)
Full support for local inference running on your own hardware.
*   Compatible with **Llama 3**, **Mistral**, **Gemma**, etc.

---

## ✨ Key Features

*   **Smart Ingestion Engine:** Converts raw text/JSON into structured data with inferred metadata.
*   **Semantic Data Hygiene:** Identifies duplicates, vagueness, and sequence gaps using AI.
*   **AI Analyst (RAG-Lite):** Natural language interface to your requirements database.
*   **Executive TL;DR:** Automated management summaries and risk assessments.
*   **Zero-Friction Demo Mode:** Explore the full UI with mock data—no API keys required.

---

## 🚀 Getting Started

### Option A: Use the Hosted App
Simply visit **[reqaudit-ai.vercel.app](https://reqaudit-ai.vercel.app)**.

* **Privacy Note (Hosted App):** This is a client-side SPA. Your content (prompts/specs) is processed in your browser.
  * If you use **Cloud Mode (Gemini)**, your browser sends requests directly to Google’s Gemini API.
  * If you use **Local Mode (Ollama)**, your browser sends requests directly to `http://localhost:11434`.
  * We do **not** run an application backend for prompt/spec processing. However, like any host/CDN, **Vercel processes request metadata (e.g., IP address, logs)** to deliver the site.


### Option B: Run Locally

```bash
# Clone
git clone https://github.com/RumiSepantaAi/reqaudit-ai.git


# Install
npm install

# Run
npm run dev
```

### Option C: Using Local LLM (Ollama)

"To use Local LLM with Ollama:
1. Clone and run the app LOCALLY (npm run dev)
2. **Set `OLLAMA_ORIGINS` (recommended: allowlist, not `*`)**
   * macOS (Ollama app):  
     `launchctl setenv OLLAMA_ORIGINS "http://localhost:5173,https://reqaudit-ai.vercel.app"`
   * Linux (systemd): set `Environment="OLLAMA_ORIGINS=http://localhost:5173,https://reqaudit-ai.vercel.app"`
   * Windows: set user env var `OLLAMA_ORIGINS` to:  
     `http://localhost:5173,https://reqaudit-ai.vercel.app`

Note: Local LLM mode ONLY works when running the app locally, not on the Vercel deployment."

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Vite 5
*   **Styling:** Tailwind CSS, Lucide Icons
*   **Visualization:** Recharts
*   **AI SDK:** Google GenAI SDK (Official) + Custom OpenAI-Compatible Adapter

---




> ⚠️ **Portfolio Demo:** This repository is a personal showcase.
