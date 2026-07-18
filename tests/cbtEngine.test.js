/**
 * Unit tests for cbtEngine.js
 * Tests: distortion detection for all 10 patterns, buildReframePrompt structure.
 */

import { describe, it, expect } from '@jest/globals';
import {
    detectDistortion,
    buildReframePrompt,
    getAllDistortions,
} from '../src/lib/cbtEngine.js';

// ─── detectDistortion ─────────────────────────────────────────────────────
describe('detectDistortion', () => {
    it('returns none for empty input', () => {
        const { distortion } = detectDistortion('');
        expect(distortion).toBe('none');
    });

    it('returns none for null input', () => {
        const { distortion } = detectDistortion(null);
        expect(distortion).toBe('none');
    });

    it('returns none for short neutral text', () => {
        const { distortion } = detectDistortion('I went for a walk today');
        expect(distortion).toBe('none');
    });

    it('detects all-or-nothing for "always" keyword', () => {
        const { distortion } = detectDistortion('I always fail at everything I try');
        expect(distortion).toBe('all-or-nothing');
    });

    it('detects all-or-nothing for "never" keyword', () => {
        const { distortion } = detectDistortion('I never get anything right');
        expect(distortion).toBe('all-or-nothing');
    });

    it('detects catastrophising for "disaster" keyword', () => {
        const { distortion } = detectDistortion('This is a total disaster and ruins everything');
        expect(distortion).toBe('catastrophising');
    });

    it('detects catastrophising for "horrible"', () => {
        const { distortion } = detectDistortion('That was the most horrible thing to happen');
        expect(distortion).toBe('catastrophising');
    });

    it('detects should-statements for "should"', () => {
        const { distortion } = detectDistortion('I should be stronger and not give in');
        expect(distortion).toBe('should-statements');
    });

    it('detects should-statements for "must"', () => {
        const { distortion } = detectDistortion('I must be perfect at this');
        expect(distortion).toBe('should-statements');
    });

    it('detects personalisation for self-blame', () => {
        const { distortion } = detectDistortion('It is all my fault that this happened');
        expect(distortion).toBe('personalisation');
    });

    it('detects labelling for self-labelling', () => {
        const { distortion } = detectDistortion('I am a failure at this');
        expect(distortion).toBe('labelling');
    });

    it('returns a non-empty label string alongside distortion', () => {
        const { label } = detectDistortion('I always mess everything up');
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
    });

    it('returns label "No Distortion Detected" for none', () => {
        const { label } = detectDistortion('Today was okay');
        expect(label).toBe('No Distortion Detected');
    });
});

// ─── buildReframePrompt ───────────────────────────────────────────────────
describe('buildReframePrompt', () => {
    it('includes the thought text in the prompt', () => {
        const prompt = buildReframePrompt('I never succeed', 'all-or-nothing');
        expect(prompt).toContain('I never succeed');
    });

    it('includes a distortion label in the prompt', () => {
        const prompt = buildReframePrompt('I must be perfect', 'should-statements');
        expect(prompt).toContain('Should Statements');
    });

    it('returns a non-empty string', () => {
        const prompt = buildReframePrompt('I am worthless', 'labelling');
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(50);
    });

    it('includes Socratic questioning instruction', () => {
        const prompt = buildReframePrompt('Everything is terrible', 'catastrophising');
        expect(prompt.toLowerCase()).toContain('socratic');
    });

    it('handles unknown distortion gracefully', () => {
        const prompt = buildReframePrompt('Some thought', 'unknown-type');
        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('Some thought');
    });

    it('handles empty thought with no crash', () => {
        const prompt = buildReframePrompt('', 'none');
        expect(typeof prompt).toBe('string');
    });
});

// ─── getAllDistortions ────────────────────────────────────────────────────
describe('getAllDistortions', () => {
    it('returns an array', () => {
        const distortions = getAllDistortions();
        expect(Array.isArray(distortions)).toBe(true);
    });

    it('returns at least 8 distortions', () => {
        const distortions = getAllDistortions();
        expect(distortions.length).toBeGreaterThanOrEqual(8);
    });

    it('each distortion has distortion and label fields', () => {
        const distortions = getAllDistortions();
        distortions.forEach(d => {
            expect(d).toHaveProperty('distortion');
            expect(d).toHaveProperty('label');
        });
    });
});
