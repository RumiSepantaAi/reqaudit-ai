# ReqAudit AI 🚀

> **Intelligent Technical Requirements Governance & Analytics Suite**

[![Deploy with Vercel](https://vercel.com/button)](https://reqaudit-ai.vercel.app)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![AI Core](https://img.shields.io/badge/AI-Gemini%20%7C%20Ollama-blue)
![Privacy](https://img.shields.io/badge/Privacy-Local--First-green)

## 🔗 [Launch Live App](https://reqaudit-ai.vercel.app)

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
*   **Air-Gapped Ready:** No data leaves your machine when using Local Mode.

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
*   **Privacy Note:** This is a client-side SPA. Your API keys are stored in *your* browser's LocalStorage and communicate directly with Google/Local APIs. No data is sent to our servers.

### Option B: Run Locally

```bash
# Clone
git clone https://github.com/your-org/reqaudit-ai.git

# Install
npm install

# Run
npm run dev
```

### Option C: Using Local LLM (Ollama)

To use ReqAudit AI with a local model like Llama 3, you must enable CORS in Ollama:

1.  **Install Ollama:** [ollama.com](https://ollama.com)
2.  **Set Environment Variable:**
    *   Mac/Linux: `launchctl setenv OLLAMA_ORIGINS "*"` (or in your shell profile)
    *   Windows: Set user environment variable `OLLAMA_ORIGINS` to `*`.
3.  **Run Model:** `ollama run llama3`
4.  **Connect:** Open ReqAudit AI, select **Local LLM**, and enter `http://localhost:11434/v1`.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript, Vite 5
*   **Styling:** Tailwind CSS, Lucide Icons
*   **Visualization:** Recharts
*   **AI SDK:** Google GenAI SDK (Official) + Custom OpenAI-Compatible Adapter

---

*Built with ❤️ for Engineering Excellence.*
