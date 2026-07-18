/**
 * HabitFlow AI - Main Application Entry Point
 * Bootstraps the SPA, manages routing, and coordinates components.
 */

import './styles/global.css';
import { renderDashboard } from './components/Dashboard.js';
import { renderHabitTracker } from './components/HabitTracker.js';
import { renderAiCoach } from './components/AiCoach.js';
import { renderCBTJournal } from './components/CBTJournal.js';
import { renderTriggerLog } from './components/TriggerLog.js';
import { showToast } from './components/Toast.js';

// ─── App State ─────────────────────────────────────────────────────────────
const state = {
    currentPage: 'dashboard',
};

// ─── Navigation ────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'habits', icon: '✅', label: 'My Habits' },
    { id: 'coach', icon: '🤖', label: 'AI Coach' },
    { id: 'cbt', icon: '🧠', label: 'CBT Journal' },
    { id: 'triggers', icon: '⚡', label: 'Trigger Log' },
];

const PAGE_RENDERERS = {
    dashboard: renderDashboard,
    habits: renderHabitTracker,
    coach: renderAiCoach,
    cbt: renderCBTJournal,
    triggers: renderTriggerLog,
};

function buildLayout() {
    document.body.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="app-container" role="application" aria-label="HabitFlow AI Application">
      <header class="app-header" role="banner">
        <div class="logo" aria-label="HabitFlow AI logo">
          <div class="logo-icon" aria-hidden="true">🌱</div>
          <span class="logo-text">HabitFlow AI</span>
        </div>
        <div class="flex items-center gap-3">
          <span id="api-status" class="badge badge-info" aria-live="polite"></span>
        </div>
      </header>

      <nav class="app-nav" role="navigation" aria-label="Main navigation">
        <span class="nav-section-label">Navigation</span>
        ${NAV_ITEMS.map(item => `
          <button
            class="nav-btn ${item.id === state.currentPage ? 'active' : ''}"
            data-page="${item.id}"
            aria-current="${item.id === state.currentPage ? 'page' : 'false'}"
            aria-label="${item.label}"
          >
            <span class="nav-icon" aria-hidden="true">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `).join('')}
      </nav>

      <main class="main-content" id="main-content" role="main" aria-live="polite">
        <div id="page-content"></div>
      </main>
    </div>
    <div class="toast-container" id="toast-container" role="status" aria-live="polite" aria-atomic="false"></div>
  `;

    // Bind navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });
}

function navigateTo(page) {
    if (page === state.currentPage) return;
    state.currentPage = page;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isActive = btn.dataset.page === page;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    const content = document.getElementById('page-content');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(8px)';
        content.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        setTimeout(() => {
            renderPage(page);
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 150);
    }
}

function renderPage(page) {
    const content = document.getElementById('page-content');
    if (!content) return;
    const renderer = PAGE_RENDERERS[page];
    if (renderer) {
        content.innerHTML = '';
        renderer(content);
    }
}

function updateApiStatus() {
    const statusEl = document.getElementById('api-status');
    if (!statusEl) return;
    const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        statusEl.textContent = '🟢 Gemini Connected';
        statusEl.className = 'badge badge-low';
    } else {
        statusEl.textContent = '🟡 Demo Mode';
        statusEl.title = 'Add VITE_GEMINI_API_KEY to .env to enable live AI coaching';
    }
}

// ─── Boot ──────────────────────────────────────────────────────────────────
function init() {
    buildLayout();
    renderPage(state.currentPage);
    updateApiStatus();

    // Keyboard shortcut: Ctrl+1-5 for navigation
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const idx = parseInt(e.key) - 1;
            if (NAV_ITEMS[idx]) navigateTo(NAV_ITEMS[idx].id);
        }
    });
}

// Expose navigateTo globally for component use
window.__habitflow__ = { navigateTo, showToast };

init();
