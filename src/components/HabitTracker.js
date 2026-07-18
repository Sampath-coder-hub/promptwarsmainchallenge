/**
 * HabitTracker Component - Add, view, and check in habits.
 * @module HabitTracker
 */

import { getHabits, saveHabit, deleteHabit, getCheckIns, logCheckIn, removeCheckIn } from '../lib/storage.js';
import { calculateStreak, getRiskLevel, generateNudge, toDateString, wasCheckedIn } from '../lib/habitEngine.js';
import { showToast } from './Toast.js';

const CATEGORIES = ['Digital', 'Substance', 'Behavioral', 'Physical', 'Emotional', 'Other'];

function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderHabitTracker(container) {
    container.innerHTML = `
    <h1 class="page-title">My Habits</h1>
    <p class="page-subtitle">Track and manage the habits you're working to overcome</p>

    <!-- Add Habit Form -->
    <div class="card mb-4" style="padding:24px;" aria-label="Add new habit form">
      <h2 class="section-title" style="margin-bottom:16px;">➕ Add New Habit</h2>
      <form id="add-habit-form" novalidate>
        <div class="grid-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label" for="habit-name">Habit Name <span aria-hidden="true" style="color:var(--clr-danger)">*</span></label>
            <input class="form-input" id="habit-name" type="text" placeholder="e.g. Excessive social media use"
              required maxlength="80" aria-required="true" aria-describedby="habit-name-hint"/>
            <span id="habit-name-hint" class="sr-only">Enter the name of the habit you want to break</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="habit-category">Category</label>
            <select class="form-select" id="habit-category" aria-label="Habit category">
              ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label" for="habit-goal">Your Goal (optional)</label>
          <input class="form-input" id="habit-goal" type="text" placeholder="e.g. Reduce to 30 min/day then quit" maxlength="200"/>
        </div>
        <button type="submit" class="btn btn-primary" id="add-habit-btn">
          <span aria-hidden="true">🌱</span> Start Tracking
        </button>
      </form>
    </div>

    <!-- Habits Grid -->
    <h2 class="section-title">Active Habits</h2>
    <div id="habits-grid" role="list" aria-label="Active habits list">
      ${renderHabitsGrid()}
    </div>
  `;

    // Form submission
    container.querySelector('#add-habit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = container.querySelector('#habit-name').value.trim();
        if (!name) {
            showToast('Habit name is required', 'error');
            container.querySelector('#habit-name').focus();
            return;
        }
        try {
            saveHabit({
                name,
                category: container.querySelector('#habit-category').value,
                goal: container.querySelector('#habit-goal').value.trim(),
            });
            container.querySelector('#add-habit-form').reset();
            container.querySelector('#habits-grid').innerHTML = renderHabitsGrid();
            bindHabitActions(container);
            showToast(`"${name}" added to your tracking list!`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    bindHabitActions(container);
}

function renderHabitsGrid() {
    const habits = getHabits();
    const today = toDateString(new Date());
    if (habits.length === 0) {
        return `<div class="card empty-state"><div class="empty-icon">🌿</div>
      <div class="empty-title">No habits yet</div>
      <div class="empty-desc">Add your first habit above to begin your journey.</div></div>`;
    }
    return `<div class="grid-2">
    ${habits.map(h => {
        const checkIns = getCheckIns(h.id);
        const relapses = [];
        const streak = calculateStreak(checkIns);
        const risk = getRiskLevel(relapses);
        const checkedToday = wasCheckedIn(checkIns, today);
        return `
      <article class="card habit-card ${checkedToday ? 'checked-in' : ''} ${risk === 'HIGH' ? 'high-risk' : ''}"
        role="listitem" aria-label="Habit: ${escHtml(h.name)}">
        <div class="flex justify-between items-center mb-2">
          <span class="badge badge-info">${escHtml(h.category)}</span>
          <span class="badge badge-${risk.toLowerCase()}" aria-label="Risk level: ${risk}">${risk} risk</span>
        </div>
        <div class="habit-name">${escHtml(h.name)}</div>
        ${h.goal ? `<div style="font-size:0.78rem;color:var(--clr-text-muted);margin-top:2px;font-style:italic;">Goal: ${escHtml(h.goal)}</div>` : ''}
        <div class="habit-streak mt-2">🔥 Streak: <strong>${streak} ${streak === 1 ? 'day' : 'days'}</strong></div>
        <div style="font-size:0.78rem;color:var(--clr-text-muted);margin-top:4px;">
          Added ${new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div class="flex gap-2 mt-3">
          <button class="btn btn-sm ${checkedToday ? 'checkin-btn checked' : 'btn-success'} checkin-btn"
            data-id="${h.id}" data-checked="${checkedToday}"
            aria-pressed="${checkedToday}"
            aria-label="${checkedToday ? 'Undo check-in for' : 'Check in for'} ${escHtml(h.name)}">
            ${checkedToday ? '✅ Checked In' : '☐ Check In'}
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${h.id}"
            aria-label="Delete habit: ${escHtml(h.name)}">🗑</button>
        </div>
      </article>`;
    }).join('')}
  </div>`;
}

function bindHabitActions(container) {
    container.querySelectorAll('.checkin-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const checked = btn.dataset.checked === 'true';
            if (checked) {
                removeCheckIn(id);
                showToast('Check-in removed', 'info');
            } else {
                logCheckIn(id);
                showToast('✅ Great work! Check-in logged!', 'success');
            }
            container.querySelector('#habits-grid').innerHTML = renderHabitsGrid();
            bindHabitActions(container);
        });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Delete this habit and all its data? This cannot be undone.')) {
                deleteHabit(btn.dataset.id);
                container.querySelector('#habits-grid').innerHTML = renderHabitsGrid();
                bindHabitActions(container);
                showToast('Habit deleted', 'info');
            }
        });
    });
}
