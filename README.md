# ReqAudit AI 🚀

> **Intelligent Technical Requirements Governance & Analytics Suite**

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![AI Core](https://img.shields.io/badge/AI%20Core-Gemini%20Hybrid%20Cascade-blue)
![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20TypeScript%20%7C%20Tailwind-slate)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Executive Summary

**ReqAudit AI** is a specialized analytics dashboard designed for Engineering Leaders, Solution Architects, and QA Managers. It transforms unstructured technical specifications (PDF exports, emails, Wikis) into structured, queryable data.

**Key Open Source Feature:** This application follows a **"Bring Your Own Key" (BYOK)** architecture. The application is a static Single Page Application (SPA). Your Gemini API key is stored locally in your browser and communicates directly with Google's APIs. No data is sent to any intermediate backend.

---

## 🧠 Architecture: The Hybrid Intelligence Cascade

To ensure 99.9% uptime and handle high-throughput analysis, ReqAudit AI implements a **Robust Model Cascade Strategy**.

1.  **Tier 1: High-Fidelity Reasoning** (`gemini-3-pro-preview`)
    *   *Used for:* Deep semantic analysis and conflicting requirement detection.
2.  **Tier 2: High-Velocity Inference** (`gemini-3-flash-preview` / `gemini-2.0-flash`)
    *   *Used for:* Bulk data parsing and syntax correction.
3.  **Tier 3: Open Source Fallback** (`gemma-2-27b-it`)
    *   *Used for:* Failover redundancy.

---

## ✨ Key Features

*   **Smart Ingestion Engine:** Converts raw text into structured JSON with inferred metadata.
*   **Semantic Data Hygiene:** Identifies duplicates, vagueness, and sequence gaps using AI.
*   **AI Analyst (RAG-Lite):** Natural language interface to your requirements database.
*   **Executive TL;DR:** Automated management summaries and risk assessments.
*   **Secure BYOK:** Complete privacy control. Reset your key at any time.

---

## 🚀 Getting Started

### 1. Deployment (Vercel/Netlify/GitHub Pages)

Since this is a client-side app, you can deploy it instantly:

1.  Fork this repository.
2.  Import to Vercel/Netlify.
3.  Run build (`npm run build`).
4.  **No Environment Variables Needed!** The app handles keys via the UI.

### 2. Local Development

```bash
# Clone
git clone https://github.com/your-org/reqaudit-ai.git

# Install
npm install

# Run
npm run dev
```

### 3. Usage

1.  Open the application.
2.  You will be prompted to enter a **Google Gemini API Key**.
    *   Get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  The key is saved to your browser's Local Storage.

---

*Built with ❤️ for Engineering Excellence.*