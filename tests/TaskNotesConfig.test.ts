import { describe, it, expect, mock } from 'bun:test';

void mock.module('obsidian', () => import('./__mocks__/obsidian'));

import { resolveEffectiveSettings } from '../src/TaskNotesConfig';
import { DEFAULT_SETTINGS } from '../src/types';

const tnBase = {
    tasksFolder: 'TN/Tasks',
    taskTag: 'task',
    defaultTaskPriority: 'high',
    defaultTaskStatus: 'in-progress',
    taskFilenameFormat: 'zettel' as const,
    storeTitleInFilename: true,
    customFilenameTemplate: '{title}',
    fieldMapping: { scheduled: 'due', contexts: 'tags' },
};

describe('resolveEffectiveSettings', () => {
    describe('when TaskNotes is not installed (null)', () => {
        it('uses DEFAULT_SETTINGS values for all overlapping fields', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, null);
            expect(result.taskFolderPath).toBe(DEFAULT_SETTINGS.taskFolderPath);
            expect(result.defaultPriority).toBe(DEFAULT_SETTINGS.defaultPriority);
            expect(result.defaultStatus).toBe(DEFAULT_SETTINGS.defaultStatus);
            expect(result.scheduledPropertyName).toBe(DEFAULT_SETTINGS.scheduledPropertyName);
            expect(result.contextPropertyName).toBe(DEFAULT_SETTINGS.contextPropertyName);
        });

        it('falls back to hardcoded defaults for TaskNotes-only fields', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, null);
            expect(result.taskTag).toBe('task');
            expect(result.filenameFormat).toBe('custom');
            expect(result.storeTitleInFilename).toBe(true);
            expect(result.customFilenameTemplate).toBe('{title}');
        });
    });

    describe('when TaskNotes is installed and task-shelf settings are at defaults', () => {
        it('picks up tasksFolder from TaskNotes', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, tnBase);
            expect(result.taskFolderPath).toBe('TN/Tasks');
        });

        it('picks up defaultTaskPriority from TaskNotes', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, tnBase);
            expect(result.defaultPriority).toBe('high');
        });

        it('picks up defaultTaskStatus from TaskNotes', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, tnBase);
            expect(result.defaultStatus).toBe('in-progress');
        });

        it('picks up fieldMapping.scheduled from TaskNotes', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, tnBase);
            expect(result.scheduledPropertyName).toBe('due');
        });

        it('picks up fieldMapping.contexts from TaskNotes', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, tnBase);
            expect(result.contextPropertyName).toBe('tags');
        });

        it('picks up taskFilenameFormat as zettel', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, tnBase);
            expect(result.filenameFormat).toBe('zettel');
        });

        it('maps non-zettel taskFilenameFormat to custom', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, {
                ...tnBase,
                taskFilenameFormat: 'title-only',
            });
            expect(result.filenameFormat).toBe('custom');
        });

        it('picks up taskTag from TaskNotes', () => {
            const result = resolveEffectiveSettings(DEFAULT_SETTINGS, {
                ...tnBase,
                taskTag: 'todo',
            });
            expect(result.taskTag).toBe('todo');
        });
    });

    describe('when task-shelf settings differ from defaults (explicit overrides)', () => {
        it('taskFolderPath override wins over TaskNotes tasksFolder', () => {
            const overridden = { ...DEFAULT_SETTINGS, taskFolderPath: 'My/Tasks' };
            const result = resolveEffectiveSettings(overridden, tnBase);
            expect(result.taskFolderPath).toBe('My/Tasks');
        });

        it('defaultPriority override wins over TaskNotes defaultTaskPriority', () => {
            const overridden = { ...DEFAULT_SETTINGS, defaultPriority: 'low' as const };
            const result = resolveEffectiveSettings(overridden, tnBase);
            expect(result.defaultPriority).toBe('low');
        });

        it('defaultStatus override wins over TaskNotes defaultTaskStatus', () => {
            const overridden = { ...DEFAULT_SETTINGS, defaultStatus: 'done' };
            const result = resolveEffectiveSettings(overridden, tnBase);
            expect(result.defaultStatus).toBe('done');
        });

        it('scheduledPropertyName override wins over TaskNotes fieldMapping.scheduled', () => {
            const overridden = { ...DEFAULT_SETTINGS, scheduledPropertyName: 'date' };
            const result = resolveEffectiveSettings(overridden, tnBase);
            expect(result.scheduledPropertyName).toBe('date');
        });

        it('contextPropertyName override wins over TaskNotes fieldMapping.contexts', () => {
            const overridden = { ...DEFAULT_SETTINGS, contextPropertyName: 'projects' };
            const result = resolveEffectiveSettings(overridden, tnBase);
            expect(result.contextPropertyName).toBe('projects');
        });
    });

    it('preserves all original task-shelf settings on the result', () => {
        const result = resolveEffectiveSettings(DEFAULT_SETTINGS, tnBase);
        expect(result.contextFolderPath).toBe(DEFAULT_SETTINGS.contextFolderPath);
        expect(result.contextExcludePattern).toBe(DEFAULT_SETTINGS.contextExcludePattern);
        expect(result.sourcePropertyName).toBe(DEFAULT_SETTINGS.sourcePropertyName);
        expect(result.autoFillSourceFromActiveFile).toBe(DEFAULT_SETTINGS.autoFillSourceFromActiveFile);
    });
});
