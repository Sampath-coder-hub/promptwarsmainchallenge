/**
 * Mock AI responses used as fallback when Gemini API is unavailable.
 * Organised by category for contextually appropriate responses.
 * @module mockResponses
 */

export const COACHING_RESPONSES = [
    "I hear you. Change is hard, and the fact that you're here working on it tells me you're serious. Research shows that even small, consistent steps lead to lasting change. What feels manageable to you today?",
    "That's a really important insight. In CBT we often say our thoughts shape our feelings which shape our behaviours. When you notice a craving, try pausing for just 10 seconds and asking: 'What am I really feeling right now?' This can interrupt the automatic response.",
    "You're showing real courage by naming this struggle. Remember that willpower is a muscle — it gets stronger with practice and rest. Are there any times of day when your cravings feel weaker? Those are your windows of opportunity.",
    "Science tells us it takes about 66 days to form a new habit, not the 21 days you may have heard. So be patient with yourself. Every single day you manage your habit is a victory worth celebrating. What's one thing you're proud of this week?",
    "Cravings are temporary — they peak within 20-30 minutes and then subside. Think of them like waves: you can surf them rather than fight them. The urge will pass. What's a healthy activity you could do for the next 30 minutes?",
    "I want you to know: relapse is a part of recovery for many people, not a sign of failure. What matters is getting back on track. Can you identify what triggered this? Understanding it is your superpower for next time.",
    "You're building a new identity, not just breaking a habit. Start telling yourself 'I'm someone who chooses [healthy alternative]' rather than 'I'm trying to stop [habit].' Identity-based habits are far more powerful.",
];

export const MOTIVATIONAL_NUDGES = [
    "🌅 Good morning! Every day is a fresh start. Your habit journey continues today.",
    "💪 You've been making real progress. Don't give up now — the hardest part is already behind you.",
    "🧠 Your brain is literally rewiring itself as you build these new patterns. Science is on your side.",
    "🌿 Recovery isn't linear. Be as kind to yourself today as you'd be to a good friend.",
    "⚡ One craving doesn't define you. You are so much stronger than any single moment of weakness.",
];

export const CBT_REFRAMES = [
    "It sounds like you're being really hard on yourself. Consider this: if a friend came to you with exactly this situation, what would you say to them? Extend that same compassion to yourself. The thought 'I always fail' ignores every time you've succeeded — and there have been many.",
    "I notice your thinking might be catastrophising a bit. Let's look at the evidence: What's the realistic worst case? What's the realistic best case? What's the most *likely* outcome? Often we'll find reality sits somewhere manageable in the middle.",
    "That sounds like an all-or-nothing pattern. Life rarely works in extremes. A 'good enough' day is still a good day. Progress, not perfection, is what builds lasting change. What small win happened today, even a tiny one?",
];

export const TRIGGER_INSIGHTS = {
    'Stress': "Stress is the #1 trigger for habit relapse. Try the 4-7-8 breathing technique: inhale 4 seconds, hold 7, exhale 8. It activates your parasympathetic nervous system within minutes.",
    'Boredom': "Boredom triggers are very common and very manageable. Try the 'productive discomfort' technique: choose one small task you've been putting off and do it for exactly 5 minutes.",
    'Social': "Social triggers are powerful because they link habit to identity. It's okay to say 'I'm taking a break from that right now.' True friends will respect that.",
    'Emotional': "Emotions are data, not emergencies. Try journaling your feelings for 3 minutes — externalising them reduces their intensity significantly.",
    'Environmental': "Environmental cues are the strongest habit triggers. Consider redesigning your space: move items that trigger the habit out of sight; place reminders of your goals where you'll see them.",
    'General': "Recognising your triggers is powerful. The next step is identifying what need the habit is trying to meet, and finding a healthier way to meet that same need.",
};

/**
 * Gets a random coaching response.
 * @returns {string}
 */
export function getRandomCoachingResponse() {
    return COACHING_RESPONSES[Math.floor(Math.random() * COACHING_RESPONSES.length)];
}

/**
 * Gets a trigger-specific insight, falling back to general if unknown.
 * @param {string} triggerType
 * @returns {string}
 */
export function getTriggerInsight(triggerType) {
    return TRIGGER_INSIGHTS[triggerType] || TRIGGER_INSIGHTS['General'];
}
