/**
 * Unit tests for analytics.js
 * Tests: weeklyTrend, triggerFrequency, complianceRate, cravingTrend.
 * Uses mock storage for isolation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { setStorage } from '../src/lib/storage.js';
import {
    getWeeklyTrend,
    getTriggerFrequency,
    getComplianceRate,
    getCravingTrend,
} from '../src/lib/analytics.js';

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

function createMockStore(checkIns = {}, triggers = []) {
    const store = {
        habitflow_checkins: JSON.stringify(checkIns),
        habitflow_triggers: JSON.stringify(triggers),
    };
    return {
        getItem: (key) => (key in store ? store[key] : null),
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    };
}

beforeEach(() => {
    setStorage(createMockStore());
});

// ─── getWeeklyTrend ───────────────────────────────────────────────────────
describe('getWeeklyTrend', () => {
    it('returns an array of exactly 7 elements', () => {
        const trend = getWeeklyTrend('habit_1');
        expect(trend).toHaveLength(7);
    });

    it('all elements are false when no check-ins exist', () => {
        const trend = getWeeklyTrend('habit_1');
        trend.forEach(d => expect(d.checked).toBe(false));
    });

    it('marks today as checked when today has a check-in', () => {
        const todayStr = new Date().toISOString().slice(0, 10);
        setStorage(createMockStore({ habit_1: [new Date().toISOString()] }));
        const trend = getWeeklyTrend('habit_1');
        const today = trend.find(d => d.date === todayStr);
        expect(today?.checked).toBe(true);
    });

    it('each element has date and checked properties', () => {
        const trend = getWeeklyTrend('habit_1');
        trend.forEach(item => {
            expect(item).toHaveProperty('date');
            expect(item).toHaveProperty('checked');
            expect(typeof item.date).toBe('string');
            expect(typeof item.checked).toBe('boolean');
        });
    });

    it('dates are in ascending order (oldest first)', () => {
        const trend = getWeeklyTrend('habit_1');
        for (let i = 1; i < trend.length; i++) {
            expect(new Date(trend[i].date).getTime()).toBeGreaterThan(
                new Date(trend[i - 1].date).getTime()
            );
        }
    });

    it('correctly shows checked for a day 3 days ago', () => {
        const threeDaysAgo = daysAgo(3).slice(0, 10);
        setStorage(createMockStore({ habit_x: [daysAgo(3)] }));
        const trend = getWeeklyTrend('habit_x');
        const target = trend.find(d => d.date === threeDaysAgo);
        expect(target?.checked).toBe(true);
    });
});

// ─── getTriggerFrequency ──────────────────────────────────────────────────
describe('getTriggerFrequency', () => {
    it('returns empty object when no triggers exist', () => {
        const freq = getTriggerFrequency('habit_1');
        expect(freq).toEqual({});
    });

    it('counts single trigger type correctly', () => {
        setStorage(createMockStore({}, [
            { habitId: 'h1', type: 'Stress', intensity: 5, timestamp: new Date().toISOString() },
        ]));
        const freq = getTriggerFrequency('h1');
        expect(freq['Stress']).toBe(1);
    });

    it('aggregates multiple triggers of the same type', () => {
        setStorage(createMockStore({}, [
            { habitId: 'h1', type: 'Stress', intensity: 5, timestamp: new Date().toISOString() },
            { habitId: 'h1', type: 'Stress', intensity: 7, timestamp: daysAgo(1) },
            { habitId: 'h1', type: 'Boredom', intensity: 3, timestamp: daysAgo(2) },
        ]));
        const freq = getTriggerFrequency('h1');
        expect(freq['Stress']).toBe(2);
        expect(freq['Boredom']).toBe(1);
    });

    it('only counts triggers for the specified habitId', () => {
        setStorage(createMockStore({}, [
            { habitId: 'h1', type: 'Stress', intensity: 5, timestamp: new Date().toISOString() },
            { habitId: 'h2', type: 'Stress', intensity: 5, timestamp: new Date().toISOString() },
        ]));
        const freq = getTriggerFrequency('h1');
        expect(freq['Stress']).toBe(1);
    });
});

// ─── getComplianceRate ────────────────────────────────────────────────────
describe('getComplianceRate', () => {
    it('returns 0 when no check-ins exist', () => {
        const rate = getComplianceRate('habit_1');
        expect(rate).toBe(0);
    });

    it('returns a number between 0 and 100', () => {
        setStorage(createMockStore({ habit_1: [daysAgo(0), daysAgo(1), daysAgo(2)] }));
        const rate = getComplianceRate('habit_1');
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
    });

    it('returns approximately 10% for 3 check-ins in 30 days', () => {
        setStorage(createMockStore({ habit_1: [daysAgo(0), daysAgo(5), daysAgo(10)] }));
        const rate = getComplianceRate('habit_1');
        expect(rate).toBe(10); // 3 out of 30 days = 10%
    });

    it('returns 100 when all 30 days have check-ins', () => {
        const checkIns = Array.from({ length: 30 }, (_, i) => daysAgo(i));
        setStorage(createMockStore({ habit_1: checkIns }));
        const rate = getComplianceRate('habit_1');
        expect(rate).toBe(100);
    });
});

// ─── getCravingTrend ──────────────────────────────────────────────────────
describe('getCravingTrend', () => {
    it('returns exactly 7 elements', () => {
        const trend = getCravingTrend('habit_1');
        expect(trend).toHaveLength(7);
    });

    it('returns 0 avgIntensity for days with no triggers', () => {
        const trend = getCravingTrend('habit_1');
        trend.forEach(d => expect(d.avgIntensity).toBe(0));
    });

    it('each element has date and avgIntensity fields', () => {
        const trend = getCravingTrend('habit_1');
        trend.forEach(item => {
            expect(item).toHaveProperty('date');
            expect(item).toHaveProperty('avgIntensity');
        });
    });

    it('calculates correct average intensity for today', () => {
        const todayStr = new Date().toISOString().slice(0, 10);
        setStorage(createMockStore({}, [
            { habitId: 'h1', type: 'Stress', intensity: 6, timestamp: new Date().toISOString() },
            { habitId: 'h1', type: 'Boredom', intensity: 4, timestamp: new Date().toISOString() },
        ]));
        const trend = getCravingTrend('h1');
        const today = trend.find(d => d.date === todayStr);
        expect(today?.avgIntensity).toBe(5); // (6+4)/2 = 5
    });
});
