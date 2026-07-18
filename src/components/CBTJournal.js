/**
 * CBTJournal Component - Cognitive Behavioral Therapy thought record and reframing.
 * @module CBTJournal
 */

import { getJournal, saveJournalEntry, escHtml } from '../lib/storage.js';
import { detectDistortion } from '../lib/cbtEngine.js';
import { getCBTReframe } from '../lib/gemini.js';
import { showToast } from './Toast.js';

export function renderCBTJournal(container) {
  container.innerHTML = `
    <h1 class="page-title">CBT Journal 🧠</h1>
    <p class="page-subtitle">Challenge negative automatic thoughts and reframe them with AI-guided Socratic questioning</p>

    <div class="grid-2 gap-4" style="align-items:start;">
      <!-- New Entry Form -->
      <div>
        <div class="card" style="padding:24px;" aria-label="New CBT thought record">
          <h2 class="section-title">📝 New Thought Record</h2>
          <form id="cbt-form" novalidate>
            <div class="form-group mb-3">
              <label class="form-label" for="cbt-thought">Automatic Negative Thought <span aria-hidden="true" style="color:var(--clr-danger)">*</span></label>
              <textarea class="form-textarea" id="cbt-thought" rows="4"
                placeholder='e.g. "I always fail at quitting. I have no willpower."'
                required aria-required="true" aria-describedby="thought-hint" maxlength="500"></textarea>
              <span id="thought-hint" style="font-size:0.75rem;color:var(--clr-text-muted);">Write the thought exactly as it appeared in your mind.</span>
            </div>

            <!-- Distortion detector (live) -->
            <div id="distortion-preview" class="mb-3 hidden">
              <div class="distortion-badge">
                <span aria-hidden="true">⚠️</span>
                <span id="distortion-label">Distortion detected</span>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full" id="cbt-submit-btn">
              <span aria-hidden="true">🔍</span> Analyse &amp; Reframe with AI
            </button>
          </form>

          <!-- Reframe Result -->
          <div id="reframe-result" class="hidden mt-4">
            <h3 style="font-size:0.85rem;font-weight:700;color:var(--clr-primary-light);margin-bottom:10px;">🌟 AI Reframe</h3>
            <div class="reframe-box" id="reframe-text" role="region" aria-label="AI-generated thought reframe" aria-live="polite"></div>
            <button class="btn btn-secondary btn-sm mt-3" id="save-entry-btn">💾 Save to Journal</button>
          </div>
        </div>

        <!-- CBT Info Card -->
        <div class="card mt-4" style="padding:20px;background:rgba(6,182,212,0.05);border-color:rgba(6,182,212,0.2);">
          <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:10px;color:var(--clr-accent);">🔬 About CBT Thought Records</h3>
          <p style="font-size:0.82rem;color:var(--clr-text-muted);line-height:1.7;">Cognitive Behavioral Therapy teaches us that our <em>thoughts</em> drive our <em>emotions</em>, which drive our <em>behaviours</em>. By identifying and challenging distorted thinking patterns, we can break the cycle of harmful habits at their root.</p>
        </div>
      </div>

      <!-- Journal History -->
      <div>
        <h2 class="section-title">📚 Journal History</h2>
        <div id="journal-list" role="list" aria-label="CBT journal entries">
          ${renderJournalList()}
        </div>
      </div>
    </div>
  `;

  const thoughtInput = container.querySelector('#cbt-thought');
  const distortionPreview = container.querySelector('#distortion-preview');
  const distortionLabel = container.querySelector('#distortion-label');
  const reframeResult = container.querySelector('#reframe-result');
  const reframeText = container.querySelector('#reframe-text');
  const submitBtn = container.querySelector('#cbt-submit-btn');

  let currentThought = '', currentDistortion = { distortion: 'none', label: '' }, currentReframe = '';

  // Live distortion detection
  thoughtInput.addEventListener('input', () => {
    const val = thoughtInput.value;
    if (val.length > 10) {
      currentDistortion = detectDistortion(val);
      if (currentDistortion.distortion !== 'none') {
        distortionLabel.textContent = `Detected: ${currentDistortion.label}`;
        distortionPreview.classList.remove('hidden');
      } else {
        distortionPreview.classList.add('hidden');
      }
    } else {
      distortionPreview.classList.add('hidden');
    }
  });

  // Form submit → AI reframe
  container.querySelector('#cbt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const thought = thoughtInput.value.trim();
    if (!thought) { showToast('Please enter your negative thought', 'error'); return; }

    currentThought = thought;
    currentDistortion = detectDistortion(thought);
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Generating reframe...';
    reframeResult.classList.add('hidden');

    try {
      currentReframe = await getCBTReframe(thought, currentDistortion.label);
      reframeText.innerHTML = currentReframe
        .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      reframeResult.classList.remove('hidden');
    } catch {
      showToast('Failed to get reframe — try again', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span aria-hidden="true">🔍</span> Analyse &amp; Reframe with AI';
    }
  });

  // Save entry
  container.querySelector('#save-entry-btn')?.addEventListener('click', () => {
    saveJournalEntry({ thought: currentThought, distortion: currentDistortion.distortion, reframe: currentReframe });
    container.querySelector('#journal-list').innerHTML = renderJournalList();
    reframeResult.classList.add('hidden');
    thoughtInput.value = '';
    distortionPreview.classList.add('hidden');
    showToast('Journal entry saved!', 'success');
  });

  const prefill = sessionStorage.getItem('cbt_prefill_thought');
  if (prefill) {
    sessionStorage.removeItem('cbt_prefill_thought');
    thoughtInput.value = prefill;
    thoughtInput.dispatchEvent(new Event('input'));
  }
}

function renderJournalList() {
  const entries = getJournal();
  if (entries.length === 0) {
    return `<div class="card empty-state"><div class="empty-icon">📖</div>
      <div class="empty-title">No entries yet</div>
      <div class="empty-desc">Complete your first thought record to build your journal.</div></div>`;
  }
  return entries.slice(0, 10).map(entry => `
    <article class="card" style="padding:16px 18px;margin-bottom:12px;" role="listitem"
      aria-label="Journal entry from ${new Date(entry.timestamp).toLocaleDateString()}">
      <div class="flex justify-between items-center mb-2">
        <span class="badge badge-medium" aria-label="Distortion type">${entry.distortion !== 'none' ? entry.distortion.replace(/-/g, ' ') : 'No distortion'}</span>
        <span style="font-size:0.72rem;color:var(--clr-text-faint);">${new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div style="font-size:0.82rem;color:var(--clr-text-muted);font-style:italic;margin-bottom:8px;padding-left:8px;border-left:2px solid var(--clr-border);">"${escHtml(entry.thought.slice(0, 150))}${entry.thought.length > 150 ? '...' : ''}"</div>
      <div style="font-size:0.82rem;line-height:1.6;color:var(--clr-text);">${escHtml(entry.reframe.slice(0, 200))}${entry.reframe.length > 200 ? '...' : ''}</div>
    </article>
  `).join('');
}
