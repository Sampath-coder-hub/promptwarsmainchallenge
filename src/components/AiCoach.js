/**
 * AiCoach Component - Conversational AI coaching interface powered by Gemini.
 * @module AiCoach
 */

import { getHabits, getCheckIns, getTriggers } from '../lib/storage.js';
import { calculateStreak, getRiskLevel } from '../lib/habitEngine.js';
import { getCoachResponse } from '../lib/gemini.js';
import { showToast } from './Toast.js';

const BOT_WELCOME = "Hi! I'm your HabitFlow AI coach 🌱 I'm here to support you with evidence-based CBT and motivational techniques. You can ask me anything about overcoming cravings, building healthier routines, or managing setbacks. What's on your mind today?";

export function renderAiCoach(container) {
  container.innerHTML = `
    <h1 class="page-title">AI Coach 🤖</h1>
    <p class="page-subtitle">Your personal, compassionate recovery coach — powered by Gemini AI</p>
    <div class="card" style="display:flex;flex-direction:column;height:calc(100vh - 220px);min-height:500px;">
      <!-- Messages -->
      <div class="chat-messages" id="chat-messages" role="log" aria-label="Chat conversation" aria-live="polite" style="flex:1;overflow-y:auto;padding:20px;">
        ${renderMessage('ai', BOT_WELCOME)}
      </div>

      <!-- Quick prompts -->
      <div style="padding:12px 20px;border-top:1px solid var(--clr-border);display:flex;gap:8px;flex-wrap:wrap;" role="group" aria-label="Quick prompt suggestions">
        ${['I had a craving today 😰', 'I relapsed, help me get back 💪', "What's a good habit to replace this?", 'I hit 7 days! 🎉'].map(p => `
          <button class="btn btn-sm btn-secondary quick-prompt" aria-label="Ask: ${p}">${p}</button>
        `).join('')}
      </div>

      <!-- Input -->
      <div style="padding:16px 20px;border-top:1px solid var(--clr-border);display:flex;gap:12px;align-items:flex-end;">
        <div style="flex:1;">
          <label class="sr-only" for="chat-input">Your message to the AI coach</label>
          <textarea class="form-input form-textarea" id="chat-input" placeholder="Share what's on your mind..."
            rows="2" style="min-height:unset;resize:none;" maxlength="1000"
            aria-label="Type your message" aria-required="true"></textarea>
        </div>
        <button class="btn btn-primary" id="send-btn" aria-label="Send message">
          <span aria-hidden="true">➤</span> Send
        </button>
      </div>
    </div>
  `;

  const messagesEl = container.querySelector('#chat-messages');
  const inputEl = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#send-btn');

  async function sendMessage(text) {
    const msg = (text || inputEl.value).trim();
    if (!msg) return;
    inputEl.value = '';
    inputEl.focus();

    // Add user message
    messagesEl.insertAdjacentHTML('beforeend', renderMessage('user', msg));

    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    messagesEl.insertAdjacentHTML('beforeend', `<div class="msg msg-ai" id="${typingId}">
      <div class="msg-avatar" aria-hidden="true">🤖</div>
      <div class="msg-bubble"><div class="typing-indicator" aria-label="AI is typing">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div></div>
    </div>`);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    sendBtn.disabled = true;

    try {
      // Build context from habits
      const habits = getHabits();
      const streaks = {}, riskLevels = {};
      habits.forEach(h => {
        streaks[h.id] = calculateStreak(getCheckIns(h.id));
        riskLevels[h.id] = getRiskLevel(getTriggers(h.id).map(t => t.timestamp));
      });

      const response = await getCoachResponse(msg, { habits, streaks, riskLevels });
      document.getElementById(typingId)?.remove();
      messagesEl.insertAdjacentHTML('beforeend', renderMessage('ai', response));
    } catch {
      document.getElementById(typingId)?.remove();
      messagesEl.insertAdjacentHTML('beforeend', renderMessage('ai', "I'm having trouble connecting right now. Please try again in a moment."));
      showToast('AI connection issue', 'error');
    } finally {
      sendBtn.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  sendBtn.addEventListener('click', () => sendMessage());
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  container.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.textContent));
  });
}

function renderMessage(role, text) {
  const avatar = role === 'ai' ? '🤖' : '👤';
  const escaped = String(text)
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  return `<div class="msg msg-${role}" role="article" aria-label="${role === 'ai' ? 'AI coach' : 'You'} message">
    <div class="msg-avatar" aria-hidden="true">${avatar}</div>
    <div class="msg-bubble">${escaped}</div>
  </div>`;
}
