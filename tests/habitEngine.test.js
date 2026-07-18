/**
 * Unit tests for habitEngine.js
 * Tests: streak calculation, risk level, nudge generation, daily score.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    calculateStreak,
    getRiskLevel,
    generateNudge,
    getDailyScore,
    toDateString,
    wasCheckedIn,
} from '../src/lib/habitEngine.js';

// Helper: build a local ISO date string N days ago (matching local toDateString)
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    // Return a local-midnight ISO-like string to avoid UTC offset problems
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
}

function todayStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ─── toDateString ──────────────────────────────────────────────────────────
describe('toDateString', () => {
    it('formats a Date object to YYYY-MM-DD', () => {
        const d = new Date('2024-06-15T12:00:00Z');
        expect(toDateString(d)).toBe('2024-06-15');
    });

    it('formats an ISO string to YYYY-MM-DD', () => {
        expect(toDateString('2024-01-01T00:00:00Z')).toBe('2024-01-01');
    });
});

// ─── calculateStreak ──────────────────────────────────────────────────────
describe('calculateStreak', () => {
    it('returns 0 for empty check-ins', () => {
        expect(calculateStreak([])).toBe(0);
    });

    it('returns 0 for null check-ins', () => {
        expect(calculateStreak(null)).toBe(0);
    });

    it('returns 1 for only today check-in', () => {
        const result = calculateStreak([new Date().toISOString()]);
        expect(result).toBe(1);
    });

    it('returns correct streak for consecutive days', () => {
        const checkIns = [daysAgo(0), daysAgo(1), daysAgo(2)];
        expect(calculateStreak(checkIns)).toBe(3);
    });

    it('returns 0 when most recent check-in is older than yesterday', () => {
        const checkIns = [daysAgo(3), daysAgo(4), daysAgo(5)];
        expect(calculateStreak(checkIns)).toBe(0);
    });

    it('stops counting at a gap', () => {
        // Today + yesterday (skip day 2) + day 3
        const checkIns = [daysAgo(0), daysAgo(1), daysAgo(3), daysAgo(4)];
        expect(calculateStreak(checkIns)).toBe(2);
    });

    it('deduplicates multiple check-ins on the same day', () => {
        const checkIns = [
            new Date().toISOString(),
            new Date().toISOString(),
            daysAgo(1),
        ];
        expect(calculateStreak(checkIns)).toBe(2);
    });

    it('returns correct streak when recently checked in yesterday', () => {
        const checkIns = [daysAgo(1), daysAgo(2)];
        expect(calculateStreak(checkIns)).toBe(2);
    });
});

// ─── getRiskLevel ──────────────────────────────────────────────────────────
describe('getRiskLevel', () => {
    it('returns LOW for empty relapses', () => {
        expect(getRiskLevel([])).toBe('LOW');
    });

    it('returns LOW for null relapses', () => {
        expect(getRiskLevel(null)).toBe('LOW');
    });

    it('returns MEDIUM for 1-2 relapses in last 7 days', () => {
        expect(getRiskLevel([daysAgo(1)])).toBe('MEDIUM');
        expect(getRiskLevel([daysAgo(2), daysAgo(4)])).toBe('MEDIUM');
    });

    it('returns HIGH for 3+ relapses in last 7 days', () => {
        expect(getRiskLevel([daysAgo(1), daysAgo(2), daysAgo(3)])).toBe('HIGH');
    });

    it('returns LOW when relapses are older than 7 days', () => {
        expect(getRiskLevel([daysAgo(10), daysAgo(15)])).toBe('LOW');
    });

    it('only counts recent relapses for HIGH determination', () => {
        // 2 old + 3 recent = HIGH
        const relapses = [daysAgo(30), daysAgo(20), daysAgo(1), daysAgo(2), daysAgo(3)];
        expect(getRiskLevel(relapses)).toBe('HIGH');
    });
});

// ─── generateNudge ────────────────────────────────────────────────────────
describe('generateNudge', () => {
    it('warns on HIGH risk regardless of streak', () => {
        const msg = generateNudge('Social Media', 10, 'HIGH');
        expect(msg).toContain('⚠️');
        expect(msg).toContain('High risk');
    });

    it('returns new-start message for 0 streak', () => {
        const msg = generateNudge('Alcohol', 0, 'LOW');
        expect(msg).toContain('🌱');
    });

    it('returns day-1 message for streak of 1', () => {
        const msg = generateNudge('Screen Time', 1, 'LOW');
        expect(msg).toContain('Day 1');
    });

    it('includes streak count in message for streak > 1', () => {
        const msg = generateNudge('Gaming', 5, 'LOW');
        expect(msg).toContain('5');
    });

    it('returns mastery message for streak > 66', () => {
        const msg = generateNudge('Smoking', 100, 'LOW');
        expect(msg).toContain('🏆');
    });

    it('includes habit name in the message', () => {
        const msg = generateNudge('Caffeine', 14, 'MEDIUM');
        expect(msg).toContain('Caffeine');
    });

    it('returns habit-forming message for streak between 21 and 65', () => {
        const msg = generateNudge('Running', 30, 'LOW');
        expect(msg).toContain('30 days');
        expect(msg).toContain('habit-forming zone');
    });
});

// ─── getDailyScore ────────────────────────────────────────────────────────
describe('getDailyScore', () => {
    it('returns 0 for empty habits array', () => {
        expect(getDailyScore([])).toBe(0);
    });

    it('returns 0 for null', () => {
        expect(getDailyScore(null)).toBe(0);
    });

    it('returns 100 when all habits are checked in today', () => {
        const today = new Date().toISOString();
        const habits = [
            { id: '1', checkIns: [today] },
            { id: '2', checkIns: [today] },
        ];
        expect(getDailyScore(habits)).toBe(100);
    });

    it('returns 0 when no habits are checked in today', () => {
        const habits = [
            { id: '1', checkIns: [daysAgo(2)] },
            { id: '2', checkIns: [daysAgo(3)] },
        ];
        expect(getDailyScore(habits)).toBe(0);
    });

    it('returns 50 when half the habits are checked in', () => {
        const today = new Date().toISOString();
        const habits = [
            { id: '1', checkIns: [today] },
            { id: '2', checkIns: [daysAgo(1)] },
        ];
        expect(getDailyScore(habits)).toBe(50);
    });
});

// ─── wasCheckedIn ─────────────────────────────────────────────────────────
describe('wasCheckedIn', () => {
    it('returns false for null checkIns', () => {
        expect(wasCheckedIn(null, todayStr())).toBe(false);
    });

    it('returns true when date is in checkIns', () => {
        const today = new Date().toISOString();
        expect(wasCheckedIn([today], todayStr())).toBe(true);
    });

    it('returns false when date is not in checkIns', () => {
        const yesterday = daysAgo(1);
        expect(wasCheckedIn([yesterday], todayStr())).toBe(false);
    });
});
