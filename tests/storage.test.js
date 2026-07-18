/**
 * Unit tests for storage.js
 * Uses an in-memory mock store instead of real localStorage.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    setStorage,
    getHabits,
    saveHabit,
    deleteHabit,
    logCheckIn,
    removeCheckIn,
    getCheckIns,
    getJournal,
    saveJournalEntry,
    getTriggers,
    saveTrigger,
    getSettings,
    saveSettings,
} from '../src/lib/storage.js';

// ─── In-memory mock localStorage ──────────────────────────────────────────
function createMockStore() {
    const store = {};
    return {
        getItem: (key) => (key in store ? store[key] : null),
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    };
}

let mockStore;
beforeEach(() => {
    mockStore = createMockStore();
    setStorage(mockStore);
});

// ─── getHabits / saveHabit ────────────────────────────────────────────────
describe('getHabits', () => {
    it('returns empty array when no habits stored', () => {
        expect(getHabits()).toEqual([]);
    });
});

describe('saveHabit', () => {
    it('saves and retrieves a habit', () => {
        saveHabit({ name: 'Social Media', category: 'Digital', goal: 'Reduce to 30 min' });
        const habits = getHabits();
        expect(habits).toHaveLength(1);
        expect(habits[0].name).toBe('Social Media');
    });

    it('generates a unique id for each habit', () => {
        saveHabit({ name: 'Smoking', category: 'Substance' });
        saveHabit({ name: 'Alcohol', category: 'Substance' });
        const habits = getHabits();
        expect(habits[0].id).not.toBe(habits[1].id);
    });

    it('throws on empty habit name', () => {
        expect(() => saveHabit({ name: '' })).toThrow('Habit name is required');
    });

    it('throws on whitespace-only habit name', () => {
        expect(() => saveHabit({ name: '   ' })).toThrow('Habit name is required');
    });

    it('sets default category to Other when not provided', () => {
        saveHabit({ name: 'Test habit' });
        const habits = getHabits();
        expect(habits[0].category).toBe('Other');
    });

    it('persists createdAt as ISO string', () => {
        saveHabit({ name: 'Gaming', category: 'Digital' });
        const habits = getHabits();
        expect(new Date(habits[0].createdAt).toISOString()).toBe(habits[0].createdAt);
    });

    it('trims whitespace from habit name', () => {
        saveHabit({ name: '  Vaping  ' });
        const habits = getHabits();
        expect(habits[0].name).toBe('Vaping');
    });
});

// ─── deleteHabit ──────────────────────────────────────────────────────────
describe('deleteHabit', () => {
    it('returns false when habit id not found', () => {
        expect(deleteHabit('nonexistent-id')).toBe(false);
    });

    it('removes the habit from storage', () => {
        const h = saveHabit({ name: 'Binge Eating', category: 'Behavioral' });
        deleteHabit(h.id);
        expect(getHabits()).toHaveLength(0);
    });

    it('returns true when habit is successfully deleted', () => {
        const h = saveHabit({ name: 'Screen Time', category: 'Digital' });
        expect(deleteHabit(h.id)).toBe(true);
    });

    it('keeps other habits when one is deleted', () => {
        saveHabit({ name: 'Habit A' });
        const b = saveHabit({ name: 'Habit B' });
        deleteHabit(b.id);
        const habits = getHabits();
        expect(habits).toHaveLength(1);
        expect(habits[0].name).toBe('Habit A');
    });
});

// ─── logCheckIn / getCheckIns ─────────────────────────────────────────────
describe('logCheckIn / getCheckIns', () => {
    it('returns empty array for habit with no check-ins', () => {
        expect(getCheckIns('habit_123')).toEqual([]);
    });

    it('logs a check-in and retrieves it', () => {
        logCheckIn('habit_1');
        const checkIns = getCheckIns('habit_1');
        expect(checkIns).toHaveLength(1);
        expect(new Date(checkIns[0]).toISOString()).toBe(checkIns[0]);
    });

    it('prevents duplicate check-ins on the same day', () => {
        logCheckIn('habit_1');
        logCheckIn('habit_1');
        expect(getCheckIns('habit_1')).toHaveLength(1);
    });

    it('keeps check-ins separate per habit id', () => {
        logCheckIn('habit_A');
        logCheckIn('habit_B');
        expect(getCheckIns('habit_A')).toHaveLength(1);
        expect(getCheckIns('habit_B')).toHaveLength(1);
    });
});

describe('removeCheckIn', () => {
    it('removes today\'s check-in', () => {
        logCheckIn('habit_x');
        expect(getCheckIns('habit_x')).toHaveLength(1);
        removeCheckIn('habit_x');
        expect(getCheckIns('habit_x')).toHaveLength(0);
    });

    it('does not throw for habit with no check-ins', () => {
        expect(() => removeCheckIn('habit_nonexistent')).not.toThrow();
    });
});

// ─── saveJournalEntry / getJournal ────────────────────────────────────────
describe('journal entries', () => {
    it('returns empty array initially', () => {
        expect(getJournal()).toEqual([]);
    });

    it('saves and retrieves a journal entry', () => {
        saveJournalEntry({ thought: 'I always fail', distortion: 'all-or-nothing', reframe: 'Actually I succeed sometimes' });
        const journal = getJournal();
        expect(journal).toHaveLength(1);
        expect(journal[0].thought).toBe('I always fail');
    });

    it('includes id and timestamp on saved entry', () => {
        const entry = saveJournalEntry({ thought: 'Test', distortion: 'none', reframe: 'Reframe' });
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('timestamp');
    });

    it('prepends new entries (most recent first)', () => {
        saveJournalEntry({ thought: 'First' });
        saveJournalEntry({ thought: 'Second' });
        const journal = getJournal();
        expect(journal[0].thought).toBe('Second');
    });

    it('handles missing fields with defaults', () => {
        const entry = saveJournalEntry({});
        expect(entry.thought).toBe('');
        expect(entry.distortion).toBe('none');
        expect(entry.reframe).toBe('');
    });
});

// ─── saveTrigger / getTriggers ────────────────────────────────────────────
describe('triggers', () => {
    it('returns empty array initially', () => {
        expect(getTriggers()).toEqual([]);
    });

    it('saves and retrieves a trigger', () => {
        saveTrigger({ habitId: 'h1', type: 'Stress', intensity: 7, note: 'Work meeting' });
        const triggers = getTriggers('h1');
        expect(triggers).toHaveLength(1);
        expect(triggers[0].type).toBe('Stress');
    });

    it('clamps intensity to 1-10 range', () => {
        const t1 = saveTrigger({ habitId: 'h1', type: 'General', intensity: 999 });
        const t2 = saveTrigger({ habitId: 'h1', type: 'General', intensity: -5 });
        expect(t1.intensity).toBe(10);
        expect(t2.intensity).toBe(1);
    });

    it('filters triggers by habitId', () => {
        saveTrigger({ habitId: 'h1', type: 'Stress', intensity: 5 });
        saveTrigger({ habitId: 'h2', type: 'Boredom', intensity: 3 });
        expect(getTriggers('h1')).toHaveLength(1);
        expect(getTriggers('h2')).toHaveLength(1);
    });

    it('returns all triggers when no habitId provided', () => {
        saveTrigger({ habitId: 'h1', type: 'Stress', intensity: 5 });
        saveTrigger({ habitId: 'h2', type: 'Boredom', intensity: 3 });
        expect(getTriggers()).toHaveLength(2);
    });

    it('handles missing fields with defaults', () => {
        const t = saveTrigger({});
        expect(t.habitId).toBe('');
        expect(t.type).toBe('General');
        expect(t.intensity).toBe(5);
        expect(t.note).toBe('');
    });
});

// ─── Settings ─────────────────────────────────────────────────────────────
describe('settings', () => {
    it('returns default settings initially', () => {
        expect(getSettings()).toEqual({ theme: 'dark', notifications: true });
    });

    it('saves and merges settings', () => {
        saveSettings({ theme: 'light' });
        expect(getSettings()).toEqual({ theme: 'light', notifications: true });
    });

    it('handles JSON.parse error gracefully in safeGet', () => {
        mockStore.setItem('habitflow_settings', 'invalid json');
        expect(getSettings()).toEqual({ theme: 'dark', notifications: true });
    });
});

describe('null store operations', () => {
    it('safely handles operations when storage is null', () => {
        setStorage(null);
        expect(getHabits()).toEqual([]);
        saveHabit({ name: 'Testing null' });
        expect(getHabits()).toEqual([]);
    });
});
