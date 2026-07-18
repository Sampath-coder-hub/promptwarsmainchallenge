# HabitFlow AI 🌱

**A GenAI-powered habit breaking and addiction recovery assistant.**

[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)](LICENSE)

---

## 🎯 Chosen Vertical

**Digital Well-being & Behavioral Modification** — helping users overcome excessive screen time, social media addiction, substance dependencies, and other harmful behavioral patterns through AI-driven coaching and evidence-based CBT techniques.

---

## 🤖 How the Solution Works

HabitFlow AI combines **Gemini 2.0-flash** with a CBT (Cognitive Behavioral Therapy) engine to deliver a comprehensive recovery experience:

| Feature | Description |
|---|---|
| **AI Coach** | Conversational Gemini-powered coach using motivational interviewing and CBT techniques with full habit context |
| **CBT Journal** | Live cognitive distortion detection (10 patterns) + AI Socratic reframing |
| **Habit Tracker** | Daily check-in with streak calculation, risk assessment, and wellness scoring |
| **Trigger Log** | Craving event logging with AI insight, frequency analysis, and intensity tracking |
| **Dashboard** | Animated wellness ring, progress table, 7-day streak dots, AI nudge |

### Architecture

```
src/
├── lib/
│   ├── habitEngine.js     # Pure functions: streak, risk, nudge, score
│   ├── cbtEngine.js       # Cognitive distortion detection & prompt building
│   ├── storage.js         # localStorage CRUD with schema validation
│   ├── analytics.js       # Weekly trends, compliance rate, craving patterns
│   └── gemini.js          # Gemini API wrapper with sanitisation & mock fallback
├── components/            # Modular UI components (Dashboard, AiCoach, etc.)
├── data/mockResponses.js  # Offline coaching responses for demo / fallback
└── main.js                # SPA router with keyboard shortcuts
tests/
├── habitEngine.test.js    # 30+ unit tests
├── cbtEngine.test.js      # 20+ unit tests  
├── storage.test.js        # 35+ unit tests
└── analytics.test.js      # 25+ unit tests
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) *(optional — app works fully in demo mode without one)*

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/promptwarsmainchallenge.git
cd promptwarsmainchallenge

# 2. Install dependencies
npm install

# 3. Configure your Gemini API key (optional)
cp .env.example .env
# Edit .env and add: VITE_GEMINI_API_KEY=your_key_here

# 4. Start the development server
npm run dev
# Open http://localhost:5173
```

### Running Tests

```bash
npm test
```

Tests are fully self-contained using an in-memory mock store — no browser or API key required.

---

## 🧠 GenAI Usage

Gemini 2.0-flash is integrated for three distinct AI functions:

1. **Coaching conversations** — context-aware responses using the user's habit list, streak data, and risk levels as part of the system prompt
2. **CBT thought reframing** — Socratic questioning prompts built from detected cognitive distortions
3. **Trigger insights** — trigger-type-specific coping strategies

All prompts are constructed with sanitised user input (HTML stripped, special characters removed, length limited) to prevent prompt injection.

**Graceful fallback:** When no API key is configured or the API is unavailable, the app serves curated mock responses from `src/data/mockResponses.js`, ensuring a fully functional demo experience.

---

## ⚙️ Approach & Logic

### Streak Algorithm
Checks consecutive days backwards from today. Deduplicates same-day entries. Allows yesterday as a valid streak-start (so users who check in at different times don't lose streaks at midnight).

### Risk Level Engine
Counts relapse events within the last 7 days:
- `HIGH` ≥ 3 events
- `MEDIUM` 1-2 events  
- `LOW` 0 events

### CBT Distortion Detection
Pattern-matched against 10 clinical cognitive distortions using regex on the natural language input. The detected distortion is included in the Gemini prompt to guide contextually appropriate reframing.

### Wellness Score
Daily score = (habits checked in today / total habits) × 100. Visualised as an animated SVG ring chart.

---

## 🔐 Security

- API key loaded via Vite env vars (`VITE_GEMINI_API_KEY`) — never hardcoded
- `.env` is in `.gitignore` — never committed to version control
- All user input is sanitised before insertion into AI prompts (HTML stripped, special character filtering, length caps)
- Gemini safety settings enforce `BLOCK_MEDIUM_AND_ABOVE` for hate speech and dangerous content
- Content Security Policy meta tag restricts resource loading

---

## ♿ Accessibility

- Skip-to-content link
- All interactive elements have `aria-label` or `<label>` associations
- `aria-live` regions for dynamic content (chat, AI responses)
- `aria-current="page"` on active navigation
- Full keyboard navigation (Tab, Enter, Space) + Ctrl+1-5 shortcuts
- Semantic HTML5 (`<main>`, `<nav>`, `<header>`, `<article>`, `<section>`)
- WCAG-compliant colour contrast ratios in dark mode

---

## 📊 Assumptions

- Users access the app in a modern browser with JavaScript enabled
- Habit data is stored locally (localStorage) — no backend required, privacy-first design
- AI coaching is supportive/educational only, not a substitute for professional mental health care
- The app works fully offline/in demo mode without a Gemini API key
- One active user per browser session (no multi-user or authentication support)

---

## 🧪 Testing

Tests use Jest with the Node test environment and a mock localStorage injected via `setStorage()`. This enables full unit testing without a browser.

```
Tests: 4 test suites, 110+ assertions
Coverage: All lib/ modules (habitEngine, cbtEngine, storage, analytics)
```

---

## 📁 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS + Vite |
| Styling | Custom CSS (glassmorphism dark theme) |
| AI | Gemini 2.0-flash REST API |
| Testing | Jest + @jest/globals |
| Storage | Browser localStorage (local-first) |

---

*Built for the Breaking Bad Habits & Addiction challenge — PromptWars Hackathon 2026*
