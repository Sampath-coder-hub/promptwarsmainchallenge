/**
 * Dashboard Component - Main overview with wellness score, streaks, and AI nudge.
 * @module Dashboard
 */

import { getHabits, getCheckIns, getTriggers, escHtml } from '../lib/storage.js';
import { calculateStreak, getRiskLevel, generateNudge, getDailyScore, toDateString, wasCheckedIn } from '../lib/habitEngine.js';
import { getWeeklyTrend, getComplianceRate } from '../lib/analytics.js';
import { getRandomCoachingResponse } from '../data/mockResponses.js';

export function renderDashboard(container) {
  const habits = getHabits();
  const today = toDateString(new Date());

  // Calculate per-habit data
  const habitData = habits.map(h => {
    const checkIns = getCheckIns(h.id);
    const relapses = getTriggers(h.id).map(t => t.timestamp);
    const streak = calculateStreak(checkIns);
    const risk = getRiskLevel(relapses);
    const checkedToday = wasCheckedIn(checkIns, today);
    const compliance = getComplianceRate(h.id);
    return { ...h, checkIns, streak, risk, checkedToday, compliance };
  });

  const totalStreak = habitData.reduce((max, h) => Math.max(max, h.streak), 0);
  const dailyScore = getDailyScore(habitData.map(h => ({ id: h.id, checkIns: h.checkIns })));
  const highRisk = habitData.filter(h => h.risk === 'HIGH').length;
  const checkedCount = habitData.filter(h => h.checkedToday).length;

  // Motivational message
  const topHabit = habitData.sort((a, b) => b.streak - a.streak)[0];
  const nudge = topHabit
    ? generateNudge(topHabit.name, topHabit.streak, topHabit.risk)
    : "🌱 Add your first habit to get started on your journey!";

  container.innerHTML = `
    <h1 class="page-title">Good ${getGreeting()}, Champion 👋</h1>
    <p class="page-subtitle">Here's your recovery overview for today, ${formatDate(new Date())}</p>

    <!-- Wellness Ring + Stats -->
    <div class="flex gap-4 mb-4" style="flex-wrap:wrap;align-items:stretch;">
      <!-- Ring Card -->
      <div class="card" style="padding:24px;display:flex;flex-direction:column;align-items:center;gap:10px;min-width:200px;">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--clr-text-muted);">Daily Wellness</div>
        ${renderRing(dailyScore)}
        <div style="font-size:0.82rem;color:var(--clr-text-muted);">${checkedCount}/${habits.length} habits checked</div>
      </div>

      <!-- Stat Cards -->
      <div style="flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
        ${renderStatCard('🔥', 'Best Streak', totalStreak + ' days', totalStreak > 0 ? '↑ Keep going!' : 'Start today', totalStreak > 0)}
        ${renderStatCard('📋', 'Total Habits', habits.length, habits.length > 0 ? 'Being tracked' : 'Add your first', true)}
        ${renderStatCard('⚠️', 'High Risk', highRisk, highRisk > 0 ? 'Need attention' : 'All clear!', highRisk === 0)}
        ${renderStatCard('✅', 'Today\'s Check-ins', checkedCount, `out of ${habits.length}`, checkedCount === habits.length && habits.length > 0)}
      </div>
    </div>

    <!-- AI Nudge Banner -->
    <div class="card card-glow mb-4" style="padding:20px 24px;border:1px solid rgba(124,58,237,0.3);background:rgba(124,58,237,0.06);">
      <div class="flex items-center gap-3 mb-2">
        <span style="font-size:1.4rem;">🤖</span>
        <span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--clr-primary-light);">AI Coach Insight</span>
      </div>
      <p style="font-size:0.9rem;line-height:1.7;">${nudge}</p>
      ${habits.length > 0 ? `
      <div class="flex gap-2 mt-3">
        <button class="btn btn-sm btn-primary" id="ask-coach-nudge-btn">💬 Ask Coach</button>
        <button class="btn btn-sm btn-secondary" id="cbt-nudge-btn">📝 CBT Reframe</button>
      </div>
      ` : ''}
    </div>

    <!-- Habit Progress Table -->
    ${habits.length > 0 ? `
    <h2 class="section-title">Habit Progress (7-day view)</h2>
    <div class="card mb-4" style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;" role="table" aria-label="Habit progress table">
        <caption class="sr-only">Progress tracking for active habits over the last 7 days</caption>
        <thead>
          <tr style="border-bottom:1px solid var(--clr-border);">
            <th style="padding:12px 16px;text-align:left;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--clr-text-muted);">Habit</th>
            <th style="padding:12px 16px;text-align:center;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--clr-text-muted);">Streak</th>
            <th style="padding:12px 16px;text-align:center;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--clr-text-muted);">Risk</th>
            <th style="padding:12px 16px;text-align:center;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--clr-text-muted);">Last 7 Days</th>
            <th style="padding:12px 16px;text-align:center;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--clr-text-muted);">30-Day %</th>
          </tr>
        </thead>
        <tbody>
          ${habitData.map(h => {
    const trend = getWeeklyTrend(h.id);
    return `
            <tr style="border-bottom:1px solid var(--clr-border);" role="row">
              <td style="padding:12px 16px;">
                <div style="font-weight:600;font-size:0.9rem;">${escHtml(h.name)}</div>
                <div style="font-size:0.75rem;color:var(--clr-text-muted);">${h.category}</div>
              </td>
              <td style="padding:12px 16px;text-align:center;font-weight:800;color:${h.streak > 0 ? 'var(--clr-warning)' : 'var(--clr-text-muted)'};">${h.streak}d</td>
              <td style="padding:12px 16px;text-align:center;"><span class="badge badge-${h.risk.toLowerCase()}">${h.risk}</span></td>
              <td style="padding:12px 16px;">
                <div class="streak-dots" style="justify-content:center;" aria-label="7-day check-in history">
                  ${trend.map((d, i) => `
                    <div class="streak-dot ${d.checked ? (i === 6 ? 'today' : 'filled') : ''}"
                      title="${d.date}: ${d.checked ? 'Checked in ✅' : 'Missed ❌'}"
                      aria-label="${d.date}: ${d.checked ? 'checked in' : 'missed'}"></div>
                  `).join('')}
                </div>
              </td>
              <td style="padding:12px 16px;text-align:center;">
                <div style="font-weight:700;color:${h.compliance >= 70 ? 'var(--clr-success)' : h.compliance >= 40 ? 'var(--clr-warning)' : 'var(--clr-danger)'};">${h.compliance}%</div>
              </td>
            </tr>`;
  }).join('')}
        </tbody>
      </table>
    </div>
    ` : `
    <div class="card empty-state">
      <div class="empty-icon">🌱</div>
      <div class="empty-title">No habits tracked yet</div>
      <div class="empty-desc">Head over to "My Habits" to add your first habit and start your recovery journey.</div>
      <button class="btn btn-primary mt-4" onclick="window.__habitflow__.navigateTo('habits')">Add First Habit</button>
    </div>
    `}

    <!-- Quick Tips -->
    <h2 class="section-title">Recovery Tips</h2>
    <div class="grid-3 gap-3">
      ${renderTipCard('🧘', '5-Minute Mindfulness', 'Close your eyes and focus on your breathing. Inhale for 4 counts, hold for 7, exhale for 8. Repeat 3 times.')}
      ${renderTipCard('📖', 'Urge Surfing', 'Observe a craving like a wave without acting on it. Cravings typically peak within 20–30 minutes and then subside.')}
      ${renderTipCard('🎯', 'HALT Check', 'Ask yourself: Am I Hungry, Angry, Lonely, or Tired? These states amplify cravings significantly.')}
    </div>
  `;

  if (habits.length > 0) {
    container.querySelector('#ask-coach-nudge-btn')?.addEventListener('click', () => {
      const prompt = `I saw this AI Coach Insight: "${nudge.replace(/"/g, '\\"')}". Can you give me more specific strategies regarding this?`;
      sessionStorage.setItem('coach_prefill_prompt', prompt);
      window.__habitflow__.navigateTo('coach');
    });

    container.querySelector('#cbt-nudge-btn')?.addEventListener('click', () => {
      const prompt = `I am struggling with my habit right now. I have a negative automatic thought: "I am going to fail."`;
      sessionStorage.setItem('cbt_prefill_thought', prompt);
      window.__habitflow__.navigateTo('cbt');
    });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderRing(score) {
  const r = 50, cx = 64, cy = 64;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const colour = score >= 75 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return `
    <div class="progress-ring" role="img" aria-label="Wellness score: ${score}%">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle class="ring-bg" cx="${cx}" cy="${cy}" r="${r}" stroke-width="10"/>
        <circle class="ring-fill" cx="${cx}" cy="${cy}" r="${r}" stroke-width="10"
          stroke="${colour}" stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}" style="transition:stroke-dashoffset 1s ease;"/>
      </svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
        <div style="font-size:1.6rem;font-weight:900;color:${colour};">${score}%</div>
      </div>
    </div>`;
}

function renderStatCard(icon, label, value, sub, positive) {
  return `
    <div class="card stat-card">
      <div style="font-size:1.5rem;margin-bottom:6px;" aria-hidden="true">${icon}</div>
      <div class="stat-value" style="font-size:1.6rem;">${value}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-change ${positive ? 'stat-up' : 'stat-down'}">${sub}</div>
    </div>`;
}

function renderTipCard(icon, title, desc) {
  return `
    <div class="card" style="padding:16px 18px;">
      <div style="font-size:1.4rem;margin-bottom:8px;" aria-hidden="true">${icon}</div>
      <div style="font-weight:700;font-size:0.9rem;margin-bottom:4px;">${title}</div>
      <div style="font-size:0.82rem;color:var(--clr-text-muted);line-height:1.6;">${desc}</div>
    </div>`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

