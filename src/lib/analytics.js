/**
 * Analytics Engine - Processes check-in history and trigger data into chart-ready formats.
 * @module analytics
 */

import { getCheckIns, getTriggers } from './storage.js';

/**
 * Returns an array of 7 booleans for the last 7 days (Mon-Sun order, latest last).
 * @param {string} habitId
 * @returns {Array<{date: string, checked: boolean}>}
 */
export function getWeeklyTrend(habitId) {
    const checkIns = getCheckIns(habitId);
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        result.push({
            date: dateStr,
            checked: checkIns.some(c => c.slice(0, 10) === dateStr),
        });
    }
    return result;
}

/**
 * Returns trigger type → occurrence count map for a habit.
 * @param {string} habitId
 * @returns {Record<string, number>}
 */
export function getTriggerFrequency(habitId) {
    const triggers = getTriggers(habitId);
    return triggers.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
    }, {});
}

/**
 * Returns the compliance rate (0-100) for the last 30 days.
 * @param {string} habitId
 * @returns {number}
 */
export function getComplianceRate(habitId) {
    const checkIns = getCheckIns(habitId);
    const checkedDays = new Set(checkIns.map(c => c.slice(0, 10)));
    let count = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (checkedDays.has(d.toISOString().slice(0, 10))) count++;
    }
    return Math.round((count / 30) * 100);
}

/**
 * Returns average craving intensity per day for the last 7 days.
 * @param {string} habitId
 * @returns {Array<{date: string, avgIntensity: number}>}
 */
export function getCravingTrend(habitId) {
    const triggers = getTriggers(habitId);
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayTriggers = triggers.filter(t => t.timestamp.slice(0, 10) === dateStr);
        const avg = dayTriggers.length
            ? dayTriggers.reduce((sum, t) => sum + t.intensity, 0) / dayTriggers.length
            : 0;
        result.push({ date: dateStr, avgIntensity: Math.round(avg * 10) / 10 });
    }
    return result;
}
