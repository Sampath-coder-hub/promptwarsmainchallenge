/**
 * TriggerLog Component - Log craving triggers, view AI insights, and see analytics.
 * @module TriggerLog
 */

import { getHabits, getTriggers, saveTrigger } from '../lib/storage.js';
import { getTriggerFrequency } from '../lib/analytics.js';
import { getTriggerAIInsight } from '../lib/gemini.js';
import { showToast } from './Toast.js';

const TRIGGER_TYPES = ['Stress', 'Boredom', 'Social', 'Emotional', 'Environmental', 'Physical', 'Time-based', 'General'];

function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderTriggerLog(container) {
    const habits = getHabits();

    container.innerHTML = `
    <h1 class="page-title">Trigger Log ⚡</h1>
    <p class="page-subtitle">Identify and understand what triggers your cravings to build better coping strategies</p>

    <div class="grid-2 gap-4" style="align-items:start;">
      <!-- Log Form -->
      <div>
        <div class="card" style="padding:24px;">
          <h2 class="section-title">📍 Log a Craving Event</h2>
          <form id="trigger-form" novalidate>
            <div class="form-group mb-3">
              <label class="form-label" for="trigger-habit">Related Habit <span aria-hidden="true" style="color:var(--clr-danger)">*</span></label>
              <select class="form-select" id="trigger-habit" aria-required="true">
                <option value="">— Select a habit —</option>
                ${habits.map(h => `<option value="${h.id}">${escHtml(h.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group mb-3">
              <label class="form-label" for="trigger-type">Trigger Type</label>
              <select class="form-select" id="trigger-type" aria-label="Type of trigger">
                ${TRIGGER_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group mb-3">
              <label class="form-label" for="trigger-intensity">Craving Intensity (1–10)</label>
              <input type="range" id="trigger-intensity" min="1" max="10" value="5" class="w-full"
                style="accent-color:var(--clr-primary);cursor:pointer;"
                aria-label="Craving intensity" aria-valuemin="1" aria-valuemax="10" aria-valuenow="5"/>
              <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--clr-text-muted);margin-top:2px;">
                <span>1 – Mild</span><span id="intensity-display" style="font-weight:700;color:var(--clr-warning);">5</span><span>10 – Severe</span>
              </div>
            </div>
            <div class="form-group mb-3">
              <label class="form-label" for="trigger-note">Notes (optional)</label>
              <input class="form-input" id="trigger-note" type="text" placeholder="What was happening when the craving hit?" maxlength="200"/>
            </div>
            <button type="submit" class="btn btn-primary w-full" id="log-trigger-btn">
              <span aria-hidden="true">⚡</span> Log Trigger &amp; Get Insight
            </button>
          </form>

          <!-- AI Insight -->
          <div id="trigger-insight" class="hidden mt-4" aria-live="polite" role="region" aria-label="AI trigger insight">
            <div class="reframe-box" id="insight-text"></div>
          </div>
        </div>
      </div>

      <!-- Log History + Frequency -->
      <div>
        <h2 class="section-title">🔥 Top Triggers</h2>
        <div id="frequency-chart" class="card mb-4" style="padding:20px;">
          ${renderFrequencyBars(habits)}
        </div>

        <h2 class="section-title">📋 Recent Events</h2>
        <div id="trigger-list" role="list" aria-label="Recent craving events">
          ${renderTriggerList()}
        </div>
      </div>
    </div>
  `;

    // Intensity slider display
    const slider = container.querySelector('#trigger-intensity');
    const display = container.querySelector('#intensity-display');
    slider.addEventListener('input', () => {
        display.textContent = slider.value;
        slider.setAttribute('aria-valuenow', slider.value);
        const val = parseInt(slider.value);
        display.style.color = val >= 8 ? 'var(--clr-danger)' : val >= 5 ? 'var(--clr-warning)' : 'var(--clr-success)';
    });

    // Form submit
    container.querySelector('#trigger-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const habitId = container.querySelector('#trigger-habit').value;
        if (!habitId) { showToast('Please select a habit', 'error'); return; }

        const triggerType = container.querySelector('#trigger-type').value;
        const intensity = parseInt(container.querySelector('#trigger-intensity').value);
        const note = container.querySelector('#trigger-note').value.trim();
        const habitName = habits.find(h => h.id === habitId)?.name || 'your habit';

        saveTrigger({ habitId, type: triggerType, intensity, note });

        const logBtn = container.querySelector('#log-trigger-btn');
        logBtn.disabled = true;
        logBtn.textContent = '⏳ Getting AI insight...';

        try {
            const insight = await getTriggerAIInsight(triggerType, habitName);
            const insightEl = container.querySelector('#trigger-insight');
            container.querySelector('#insight-text').innerHTML = '🧠 <strong>AI Insight:</strong> ' +
                String(insight).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
            insightEl.classList.remove('hidden');
        } catch {
            showToast('Could not load AI insight', 'error');
        } finally {
            logBtn.disabled = false;
            logBtn.innerHTML = '<span aria-hidden="true">⚡</span> Log Trigger &amp; Get Insight';
        }

        container.querySelector('#trigger-form').reset();
        display.textContent = '5';
        container.querySelector('#trigger-list').innerHTML = renderTriggerList();
        container.querySelector('#frequency-chart').innerHTML = renderFrequencyBars(habits).outerHTML || renderFrequencyBars(habits);
        showToast('Craving event logged!', 'success');
    });
}

function renderFrequencyBars(habits) {
    const allTriggers = getTriggers();
    const freq = allTriggers.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {});
    const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] || 1;

    if (entries.length === 0) {
        return '<div class="empty-state" style="padding:24px;"><div class="empty-icon">📊</div><div class="empty-title">No triggers logged yet</div></div>';
    }

    return entries.slice(0, 6).map(([type, count]) => `
    <div style="margin-bottom:12px;">
      <div class="flex justify-between" style="margin-bottom:4px;">
        <span style="font-size:0.82rem;font-weight:600;">${escHtml(type)}</span>
        <span style="font-size:0.78rem;color:var(--clr-text-muted);">${count}x</span>
      </div>
      <div style="background:var(--clr-surface-3);border-radius:100px;height:6px;overflow:hidden;" role="img" aria-label="${type}: ${count} occurrences">
        <div style="height:100%;width:${Math.round((count / max) * 100)}%;background:linear-gradient(to right,var(--clr-primary),var(--clr-accent));border-radius:100px;transition:width 0.6s ease;"></div>
      </div>
    </div>
  `).join('');
}

function renderTriggerList() {
    const triggers = getTriggers().slice(0, 15);
    if (triggers.length === 0) {
        return `<div class="card empty-state" style="padding:24px;"><div class="empty-icon">⚡</div>
      <div class="empty-title">No triggers logged yet</div>
      <div class="empty-desc">Log your first craving event to identify patterns.</div></div>`;
    }
    return triggers.map(t => {
        const intClass = t.intensity >= 8 ? 'intensity-high' : t.intensity >= 5 ? 'intensity-med' : 'intensity-low';
        return `<div class="trigger-item" role="listitem" aria-label="Trigger: ${escHtml(t.type)}, intensity ${t.intensity}">
      <div class="trigger-intensity ${intClass}" aria-hidden="true">${t.intensity}</div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.88rem;">${escHtml(t.type)}</div>
        ${t.note ? `<div style="font-size:0.78rem;color:var(--clr-text-muted);">${escHtml(t.note)}</div>` : ''}
      </div>
      <div style="font-size:0.72rem;color:var(--clr-text-faint);text-align:right;">
        ${new Date(t.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>`;
    }).join('');
}
