/**
 * Habit Engine - Core logic for streak calculation, risk assessment, and nudge generation.
 * @module habitEngine
 */

/**
 * Normalises a Date object or ISO string to a local YYYY-MM-DD string.
 * Uses local time components to avoid UTC offset issues.
 * @param {Date|string} date
 * @returns {string}
 */
export function toDateString(date) {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Subtracts n days from a date and returns the local YYYY-MM-DD string.
 * @param {Date} date
 * @param {number} n
 * @returns {string}
 */
function subtractDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() - n);
    return toDateString(d);
}

/**
 * Calculates the current consecutive-day streak from an array of check-in date strings.
 * @param {string[]} checkIns - Array of ISO date strings.
 * @returns {number} The current streak in days.
 */
export function calculateStreak(checkIns) {
    if (!checkIns || checkIns.length === 0) return 0;

    const uniqueDays = [...new Set(checkIns.map(toDateString))].sort().reverse();
    const today = toDateString(new Date());
    const yesterday = subtractDays(new Date(), 1);

    // Streak must start from today or yesterday
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

    let streak = 0;
    let expectedDate = new Date();
    if (uniqueDays[0] === yesterday) {
        // Start from yesterday
        expectedDate.setDate(expectedDate.getDate() - 1);
    }

    for (const dayStr of uniqueDays) {
        const expected = toDateString(expectedDate);
        if (dayStr === expected) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Determines risk level based on recent relapse events in the last 7 days.
 * @param {string[]} relapses - ISO date strings of relapses.
 * @returns {'HIGH'|'MEDIUM'|'LOW'}
 */
export function getRiskLevel(relapses) {
    if (!relapses || relapses.length === 0) return 'LOW';

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRelapses = relapses.filter(r => new Date(r) >= sevenDaysAgo);

    if (recentRelapses.length >= 3) return 'HIGH';
    if (recentRelapses.length >= 1) return 'MEDIUM';
    return 'LOW';
}

/**
 * Generates a context-aware nudge message.
 * @param {string} habitName
 * @param {number} streakDays
 * @param {'HIGH'|'MEDIUM'|'LOW'} riskLevel
 * @returns {string}
 */
export function generateNudge(habitName, streakDays, riskLevel) {
    if (riskLevel === 'HIGH') {
        return `⚠️ High risk detected for "${habitName}". Remember: one setback doesn't erase your progress. Reach out to your support system right now.`;
    }
    if (streakDays === 0) {
        return `🌱 Starting your journey to overcome "${habitName}" today. Every expert was once a beginner.`;
    }
    if (streakDays === 1) {
        return `🎉 Day 1 complete for "${habitName}"! The first step is always the hardest. Keep going!`;
    }
    if (streakDays < 7) {
        return `🔥 ${streakDays} days strong on "${habitName}"! You're building real momentum. Don't break the chain!`;
    }
    if (streakDays < 21) {
        return `💪 ${streakDays} days! Research shows habits start forming around day 21. You're on track for "${habitName}"!`;
    }
    if (streakDays < 66) {
        return `🌟 ${streakDays} days! Incredible dedication on "${habitName}". You're in the habit-forming zone!`;
    }
    return `🏆 ${streakDays} days — you've mastered "${habitName}"! You are an inspiration!`;
}

/**
 * Calculates an aggregate wellness score (0-100) based on habit check-in compliance today.
 * @param {Array<{id: string, checkIns: string[]}>} habits
 * @returns {number} Wellness score 0-100.
 */
export function getDailyScore(habits) {
    if (!habits || habits.length === 0) return 0;
    const today = toDateString(new Date());
    const checkedToday = habits.filter(h =>
        h.checkIns && h.checkIns.some(c => toDateString(c) === today)
    );
    return Math.round((checkedToday.length / habits.length) * 100);
}

/**
 * Checks if a habit was checked in on a specific date.
 * @param {string[]} checkIns
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
export function wasCheckedIn(checkIns, dateStr) {
    if (!checkIns) return false;
    return checkIns.some(c => toDateString(c) === dateStr);
}
