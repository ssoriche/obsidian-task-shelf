import { describe, it, expect, mock, beforeAll, afterAll, setSystemTime } from 'bun:test';

void mock.module('obsidian', () => import('./__mocks__/obsidian'));

import { generateBaseName } from '../src/TaskCreator';
import { DEFAULT_SETTINGS } from '../src/types';
import type { EffectiveSettings } from '../src/types';

const baseEffective: EffectiveSettings = {
    ...DEFAULT_SETTINGS,
    taskTag: 'task',
    filenameFormat: 'custom',
    storeTitleInFilename: true,
    customFilenameTemplate: '{title}',
};

const FIXED_DATE = new Date('2026-04-02T15:30:00');

describe('generateBaseName', () => {
    describe('custom format (default)', () => {
        it('returns sanitized title when template is {title}', () => {
            expect(generateBaseName('Fix the bug', baseEffective)).toBe('Fix the bug');
        });

        it('sanitizes unsafe filename characters', () => {
            expect(generateBaseName('Fix: the/bug?', baseEffective)).toBe('Fix- the-bug-');
        });

        it('trims surrounding whitespace', () => {
            expect(generateBaseName('  my task  ', baseEffective)).toBe('my task');
        });

        it('substitutes {title} in a custom template', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                customFilenameTemplate: 'TASK - {title}',
            };
            expect(generateBaseName('Fix the bug', settings)).toBe('TASK - Fix the bug');
        });

        it('substitutes {date} with ISO date in a custom template', () => {
            setSystemTime(new Date('2026-04-02T15:30:00'));
            const settings: EffectiveSettings = {
                ...baseEffective,
                customFilenameTemplate: '{date} {title}',
            };
            expect(generateBaseName('Fix the bug', settings)).toBe('2026-04-02 Fix the bug');
            setSystemTime(0);
        });

        it('replaces all occurrences of {title} in template', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                customFilenameTemplate: '{title} - {title}',
            };
            expect(generateBaseName('Fix', settings)).toBe('Fix - Fix');
        });

        it('sanitizes unsafe chars introduced by the template itself', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                customFilenameTemplate: 'tasks/{title}',
            };
            expect(generateBaseName('Fix', settings)).toBe('tasks-Fix');
        });

        it('falls back to "untitled" when rendered result is empty', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                customFilenameTemplate: '{title}',
            };
            expect(generateBaseName('   ', settings)).toBe('untitled');
        });

        it('pads single-digit month and day in {date}', () => {
            setSystemTime(new Date('2026-01-05T09:03:00'));
            const settings: EffectiveSettings = {
                ...baseEffective,
                customFilenameTemplate: '{date} {title}',
            };
            expect(generateBaseName('x', settings)).toBe('2026-01-05 x');
            setSystemTime(0);
        });
    });

    describe('zettel format', () => {
        beforeAll(() => setSystemTime(FIXED_DATE));
        afterAll(() => setSystemTime(0));

        it('generates a 12-digit timestamp prefix', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                filenameFormat: 'zettel',
                storeTitleInFilename: true,
            };
            const result = generateBaseName('Fix the bug', settings);
            expect(result).toBe('202604021530 Fix the bug');
        });

        it('omits title when storeTitleInFilename is false', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                filenameFormat: 'zettel',
                storeTitleInFilename: false,
            };
            const result = generateBaseName('Fix the bug', settings);
            expect(result).toBe('202604021530');
        });

        it('returns only timestamp when title is empty and storeTitleInFilename is true', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                filenameFormat: 'zettel',
                storeTitleInFilename: true,
            };
            expect(generateBaseName('   ', settings)).toBe('202604021530');
        });

        it('sanitizes unsafe chars in the title portion', () => {
            const settings: EffectiveSettings = {
                ...baseEffective,
                filenameFormat: 'zettel',
                storeTitleInFilename: true,
            };
            expect(generateBaseName('Fix: the/bug?', settings)).toBe('202604021530 Fix- the-bug-');
        });

        it('pads single-digit month, day, hour, minute', () => {
            setSystemTime(new Date('2026-01-05T09:03:00'));
            const settings: EffectiveSettings = {
                ...baseEffective,
                filenameFormat: 'zettel',
                storeTitleInFilename: false,
            };
            expect(generateBaseName('x', settings)).toBe('202601050903');
            setSystemTime(FIXED_DATE);
        });
    });
});
