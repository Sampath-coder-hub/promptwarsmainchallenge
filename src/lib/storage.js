/**
 * Storage - LocalStorage CRUD with schema validation and safe JSON parse.
 * @module storage
 */

const KEYS = {
    HABITS: 'habitflow_habits',
    CHECKINS: 'habitflow_checkins',
    JOURNAL: 'habitflow_journal',
    TRIGGERS: 'habitflow_triggers',
    SETTINGS: 'habitflow_settings',
};

/** @type {typeof window.localStorage | null} */
let _store = (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') ? window.localStorage : null;

/**
 * Allows injecting a mock storage for testing.
 * @param {Storage} mockStore
 */
export function setStorage(mockStore) {
    _store = mockStore;
}

function safeGet(key) {
    try {
        const raw = _store ? _store.getItem(key) : null;
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function safeSet(key, value) {
    if (_store) {
        _store.setItem(key, JSON.stringify(value));
    }
}

// ─── Habits ────────────────────────────────────────────────────────────────

/**
 * @typedef {'Digital'|'Substance'|'Behavioral'|'Physical'|'Other'} HabitCategory
 * @typedef {{ id: string, name: string, category: HabitCategory, goal: string, createdAt: string }} Habit
 */

/**
 * Returns all stored habits.
 * @returns {Habit[]}
 */
export function getHabits() {
    return safeGet(KEYS.HABITS) || [];
}

/**
 * Saves a new habit. Validates required fields.
 * @param {{ name: string, category: HabitCategory, goal: string }} habit
 * @returns {Habit} The saved habit with generated id.
 * @throws {Error} If required fields are missing.
 */
export function saveHabit(habit) {
    if (!habit.name || typeof habit.name !== 'string' || habit.name.trim() === '') {
        throw new Error('Habit name is required');
    }
    const habits = getHabits();
    const newHabit = {
        id: `habit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: habit.name.trim(),
        category: habit.category || 'Other',
        goal: habit.goal || '',
        createdAt: new Date().toISOString(),
    };
    habits.push(newHabit);
    safeSet(KEYS.HABITS, habits);
    return newHabit;
}

/**
 * Deletes a habit and its associated check-ins.
 * @param {string} id
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteHabit(id) {
    const habits = getHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index === -1) return false;
    habits.splice(index, 1);
    safeSet(KEYS.HABITS, habits);
    // Clean up check-ins
    const checkIns = safeGet(KEYS.CHECKINS) || {};
    delete checkIns[id];
    safeSet(KEYS.CHECKINS, checkIns);
    return true;
}

// ─── Check-ins ─────────────────────────────────────────────────────────────

/**
 * Logs a check-in for a habit on the current date.
 * @param {string} habitId
 * @returns {string} ISO date string of the check-in.
 */
export function logCheckIn(habitId) {
    const checkIns = safeGet(KEYS.CHECKINS) || {};
    if (!checkIns[habitId]) checkIns[habitId] = [];
    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);
    // Prevent duplicate same-day check-ins
    const alreadyToday = checkIns[habitId].some(c => c.slice(0, 10) === todayStr);
    if (!alreadyToday) {
        checkIns[habitId].push(now);
    }
    safeSet(KEYS.CHECKINS, checkIns);
    return now;
}

/**
 * Removes today's check-in for a habit.
 * @param {string} habitId
 */
export function removeCheckIn(habitId) {
    const checkIns = safeGet(KEYS.CHECKINS) || {};
    if (!checkIns[habitId]) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    checkIns[habitId] = checkIns[habitId].filter(c => c.slice(0, 10) !== todayStr);
    safeSet(KEYS.CHECKINS, checkIns);
}

/**
 * Returns all check-in dates for a habit.
 * @param {string} habitId
 * @returns {string[]}
 */
export function getCheckIns(habitId) {
    const checkIns = safeGet(KEYS.CHECKINS) || {};
    return checkIns[habitId] || [];
}

// ─── Journal ───────────────────────────────────────────────────────────────

/**
 * @typedef {{ id: string, thought: string, distortion: string, reframe: string, timestamp: string }} JournalEntry
 */

/**
 * @returns {JournalEntry[]}
 */
export function getJournal() {
    return safeGet(KEYS.JOURNAL) || [];
}

/**
 * @param {{ thought: string, distortion: string, reframe: string }} entry
 * @returns {JournalEntry}
 */
export function saveJournalEntry(entry) {
    const journal = getJournal();
    const newEntry = {
        id: `journal_${Date.now()}`,
        thought: entry.thought || '',
        distortion: entry.distortion || 'none',
        reframe: entry.reframe || '',
        timestamp: new Date().toISOString(),
    };
    journal.unshift(newEntry);
    safeSet(KEYS.JOURNAL, journal);
    return newEntry;
}

// ─── Triggers ──────────────────────────────────────────────────────────────

/**
 * @typedef {{ id: string, habitId: string, type: string, intensity: number, note: string, timestamp: string }} TriggerLog
 */

/**
 * @returns {TriggerLog[]}
 */
export function getTriggers(habitId) {
    const all = safeGet(KEYS.TRIGGERS) || [];
    return habitId ? all.filter(t => t.habitId === habitId) : all;
}

/**
 * @param {{ habitId: string, type: string, intensity: number, note: string }} trigger
 * @returns {TriggerLog}
 */
export function saveTrigger(trigger) {
    const triggers = safeGet(KEYS.TRIGGERS) || [];
    const newTrigger = {
        id: `trigger_${Date.now()}`,
        habitId: trigger.habitId || '',
        type: trigger.type || 'General',
        intensity: Math.min(10, Math.max(1, trigger.intensity || 5)),
        note: trigger.note || '',
        timestamp: new Date().toISOString(),
    };
    triggers.unshift(newTrigger);
    safeSet(KEYS.TRIGGERS, triggers);
    return newTrigger;
}

// ─── Settings ──────────────────────────────────────────────────────────────

export function getSettings() {
    return safeGet(KEYS.SETTINGS) || { theme: 'dark', notifications: true };
}

export function saveSettings(settings) {
    safeSet(KEYS.SETTINGS, { ...getSettings(), ...settings });
}

/**
 * Safe HTML escaping to prevent XSS injection.
 * @param {string} str
 * @returns {string}
 */
export function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
