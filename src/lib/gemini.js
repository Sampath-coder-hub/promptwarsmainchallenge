/**
 * Gemini API wrapper with graceful fallback to mock responses.
 * Sanitises all user input before including in prompts.
 * @module gemini
 */

import { getRandomCoachingResponse, getTriggerInsight, CBT_REFRAMES } from '../data/mockResponses.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Strips HTML tags and limits input length to prevent prompt injection.
 * @param {string} input
 * @param {number} [maxLen=1000]
 * @returns {string}
 */
function sanitise(input, maxLen = 1000) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/<[^>]*>/g, '')                     // strip HTML
        .replace(/[^\w\s.,!?'"()\-:;@#%&*+=]/g, '') // remove special chars
        .trim()
        .slice(0, maxLen);
}

/**
 * Calls the Gemini API with a prompt. Returns the text response.
 * @param {string} prompt
 * @param {string} apiKey
 * @returns {Promise<string>}
 */
async function callGemini(prompt, apiKey) {
    const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 512,
                topP: 0.9,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
        }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Gets the API key from Vite env or process.env for tests.
 * @returns {string|null}
 */
function getApiKey() {
    try {
        if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) {
            return process.env.VITE_GEMINI_API_KEY;
        }
        return import.meta?.env?.VITE_GEMINI_API_KEY || null;
    } catch {
        return null;
    }
}

/**
 * Sends a user message to the AI coach. Uses Gemini if key available, else mock.
 * @param {string} userMessage
 * @param {{ habits: Array, streaks: Object, riskLevels: Object }} context
 * @returns {Promise<string>}
 */
export async function getCoachResponse(userMessage, context = {}) {
    const safeMessage = sanitise(userMessage);
    const apiKey = getApiKey();

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        try {
            const habitSummary = (context.habits || [])
                .map(h => `- ${sanitise(h.name)}: ${context.streaks?.[h.id] ?? 0} day streak, risk: ${context.riskLevels?.[h.id] ?? 'LOW'}`)
                .join('\n') || 'No habits tracked yet.';

            const prompt = `You are HabitFlow AI, a compassionate, evidence-based habit and addiction recovery coach using CBT and motivational interviewing techniques.

User's current habits:
${habitSummary}

User says: "${safeMessage}"

Respond with empathy, practical advice, and encouragement. Keep it concise (under 150 words). Do not provide medical advice. If the user mentions crisis or self-harm, direct them to professional help immediately.`;

            return await callGemini(prompt, apiKey);
        } catch (err) {
            console.warn('Gemini API unavailable, using mock response:', err.message);
        }
    }

    return getRandomCoachingResponse();
}

/**
 * Gets an AI-powered CBT reframe for a thought.
 * @param {string} thought
 * @param {string} distortionLabel
 * @returns {Promise<string>}
 */
export async function getCBTReframe(thought, distortionLabel) {
    const safeThought = sanitise(thought, 500);
    const apiKey = getApiKey();

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        try {
            const prompt = `You are a compassionate CBT therapist. The user has this automatic negative thought:

"${safeThought}"

Detected cognitive distortion: ${sanitise(distortionLabel, 100)}

Please:
1. Validate their feelings briefly (1-2 sentences)
2. Gently name the distortion pattern
3. Offer 2-3 alternative perspectives using Socratic questioning
4. End with a brief actionable positive reframe

Keep response warm, under 200 words, non-clinical.`;

            return await callGemini(prompt, apiKey);
        } catch (err) {
            console.warn('Gemini API unavailable, using mock CBT reframe:', err.message);
        }
    }

    return CBT_REFRAMES[Math.floor(Math.random() * CBT_REFRAMES.length)];
}

/**
 * Gets an AI insight for a specific craving trigger.
 * @param {string} triggerType
 * @param {string} habitName
 * @returns {Promise<string>}
 */
export async function getTriggerAIInsight(triggerType, habitName) {
    const safeTrigger = sanitise(triggerType, 100);
    const safeHabit = sanitise(habitName, 100);
    const apiKey = getApiKey();

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        try {
            const prompt = `A user tracking their "${safeHabit}" habit just logged a craving triggered by: "${safeTrigger}".

Give a brief, compassionate, evidence-based tip (2-3 sentences) for managing this specific trigger type. Be specific and actionable.`;

            return await callGemini(prompt, apiKey);
        } catch {
            // fall through to mock
        }
    }

    return getTriggerInsight(triggerType);
}
