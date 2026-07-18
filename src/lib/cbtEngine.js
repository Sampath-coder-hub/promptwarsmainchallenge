/**
 * CBT Engine - Cognitive Behavioral Therapy helpers.
 * Detects cognitive distortions and builds reframing prompts.
 * @module cbtEngine
 */

/** @typedef {'all-or-nothing'|'catastrophising'|'mind-reading'|'fortune-telling'|'emotional-reasoning'|'should-statements'|'labelling'|'magnification'|'personalisation'|'filtering'|'none'} Distortion */

/**
 * Keyword patterns mapped to cognitive distortion types.
 * @type {Array<{pattern: RegExp, distortion: Distortion, label: string}>}
 */
const DISTORTION_PATTERNS = [
    // Personalisation checked first to avoid 'all' in 'all my fault' matching all-or-nothing
    { pattern: /\b(my fault|blame myself|i caused|because of me|i ruined)\b/i, distortion: 'personalisation', label: 'Personalisation' },
    { pattern: /\b(disaster|terrible|awful|horrible|ruined|worst|catastrophe|end of the world)\b/i, distortion: 'catastrophising', label: 'Catastrophising' },
    { pattern: /\b(i am a (failure|loser|idiot|fraud|worthless|weak|addict))\b/i, distortion: 'labelling', label: 'Labelling' },
    { pattern: /\b(should|must|ought|have to|need to|supposed to|shouldn't)\b/i, distortion: 'should-statements', label: 'Should Statements' },
    // 'all' matched only when not followed by a possessive (to avoid 'all my')
    { pattern: /\b(always|never|every time|nobody|everyone|nothing|completely)\b|\ball\b(?!\s+my\b)/i, distortion: 'all-or-nothing', label: 'All-or-Nothing Thinking' },
    { pattern: /\b(they (think|feel|hate|don't like)|everyone thinks|people think|she thinks|he thinks)\b/i, distortion: 'mind-reading', label: 'Mind Reading' },
    { pattern: /\b(will (never|always|fail|hate)|going to (fail|mess up)|won't work|bound to)\b/i, distortion: 'fortune-telling', label: 'Fortune Telling' },
    { pattern: /\b(feel (like|that)|feels (wrong|bad|right)|my gut|i feel therefore)\b/i, distortion: 'emotional-reasoning', label: 'Emotional Reasoning' },
    { pattern: /\b(huge|massive|enormous|gigantic|incredibly (bad|stupid|wrong))\b/i, distortion: 'magnification', label: 'Magnification' },
    { pattern: /\b(only see the bad|ignoring the good|focus on|dwell on)\b/i, distortion: 'filtering', label: 'Mental Filtering' },
];

/**
 * Detects the most likely cognitive distortion in a thought string.
 * @param {string} thoughtText
 * @returns {{ distortion: Distortion, label: string }}
 */
export function detectDistortion(thoughtText) {
    if (!thoughtText || typeof thoughtText !== 'string') {
        return { distortion: 'none', label: 'No Distortion Detected' };
    }

    for (const { pattern, distortion, label } of DISTORTION_PATTERNS) {
        if (pattern.test(thoughtText)) {
            return { distortion, label };
        }
    }
    return { distortion: 'none', label: 'No Distortion Detected' };
}

/**
 * Builds a structured Gemini prompt to reframe a distorted thought.
 * @param {string} thought - The user's automatic negative thought.
 * @param {Distortion} distortion - The identified distortion type.
 * @returns {string} Prompt string for the AI.
 */
export function buildReframePrompt(thought, distortion) {
    const distortionLabel = DISTORTION_PATTERNS.find(d => d.distortion === distortion)?.label || 'cognitive distortion';
    return `You are a compassionate CBT therapist. The user has identified this automatic negative thought:

"${thought}"

This appears to involve the cognitive distortion: **${distortionLabel}**.

Please:
1. Validate their feelings with empathy (1-2 sentences)
2. Gently highlight the distortion without being clinical
3. Offer 2-3 evidence-based alternative perspectives using Socratic questioning
4. End with a brief, actionable positive reframe

Keep your response warm, concise (under 200 words), and non-judgmental.`;
}

/**
 * Returns all registered distortion patterns (for reference/UI display).
 * @returns {Array<{distortion: Distortion, label: string}>}
 */
export function getAllDistortions() {
    return DISTORTION_PATTERNS.map(({ distortion, label }) => ({ distortion, label }));
}
