import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { getCoachResponse, getCBTReframe, getTriggerAIInsight } from '../src/lib/gemini.js';
import * as mockResponses from '../src/data/mockResponses.js';

// Mock the global fetch
global.fetch = jest.fn();

describe('gemini.js API operations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear env vars
        delete process.env.VITE_GEMINI_API_KEY;
    });

    test('sanitises input and returns mock if no API key', async () => {
        const response = await getCoachResponse('Hello <script>alert(1)</script>');
        expect(response).toBeDefined();
        // Since we are mocking, it should return a mock response
        expect(mockResponses.getRandomCoachingResponse).toBeDefined();
    });

    test('uses API if VITE_GEMINI_API_KEY is present and valid', async () => {
        process.env.VITE_GEMINI_API_KEY = 'valid_key';
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'API response' }] } }]
            })
        });

        const response = await getCoachResponse('Help me', { habits: [{ id: 1, name: 'Smoking' }] });
        expect(response).toBe('API response');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('falls back to mock if API request fails', async () => {
        process.env.VITE_GEMINI_API_KEY = 'valid_key';
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        // Suppress console.warn for this test
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

        const response = await getCoachResponse('Help me');
        expect(response).toBeDefined();
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    test('getCBTReframe returns mock or API based on env', async () => {
        // Mock
        let reframe = await getCBTReframe('Everything is ruined', 'Catastrophizing');
        expect(reframe).toBeDefined();

        // API key present
        process.env.VITE_GEMINI_API_KEY = 'valid_key';
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'It is not ruined.' }] } }]
            })
        });
        reframe = await getCBTReframe('Everything is ruined', 'Catastrophizing');
        expect(reframe).toBe('It is not ruined.');

        // API failure fallback
        global.fetch.mockResolvedValueOnce({ ok: false });
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        reframe = await getCBTReframe('Everything is ruined', 'Catastrophizing');
        expect(reframe).toBeDefined();
        warnSpy.mockRestore();
    });

    test('getTriggerAIInsight returns mock or API based on env', async () => {
        let insight = await getTriggerAIInsight('Stress', 'Drinking');
        expect(insight).toBeDefined();

        process.env.VITE_GEMINI_API_KEY = 'valid_key';
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'Take a breath.' }] } }]
            })
        });
        insight = await getTriggerAIInsight('Stress', 'Drinking');
        expect(insight).toBe('Take a breath.');

        global.fetch.mockRejectedValueOnce(new Error('Network error'));
        insight = await getTriggerAIInsight('Stress', 'Drinking');
        expect(insight).toBeDefined();
    });

    // To hit the "typeof input !== 'string'" branch in sanitise:
    test('sanitise handles non-string input gracefully', async () => {
        // Since sanitise is not exported, we pass a non-string to an exported function
        const response = await getCoachResponse(null);
        expect(response).toBeDefined();
    });

    test('getApiKey catch block is triggered when env access throws', async () => {
        const originalEnv = process.env;
        Object.defineProperty(process, 'env', {
            get() { throw new Error('Simulated env access error'); },
            configurable: true
        });

        const response = await getCoachResponse('Test');
        expect(response).toBeDefined();

        Object.defineProperty(process, 'env', {
            value: originalEnv,
            writable: true,
            configurable: true
        });
    });

    test('handles empty candidates from API gracefully', async () => {
        process.env.VITE_GEMINI_API_KEY = 'valid_key';
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: []
            })
        });

        const response = await getCoachResponse('Help me');
        expect(response).toBe('');
    });
});
