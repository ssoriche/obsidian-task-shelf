import { App } from 'obsidian';
import { TaskShelfSettings, EffectiveSettings, DEFAULT_SETTINGS } from './types';

const TASKNOTES_PLUGIN_DATA = 'plugins/tasknotes/data.json';

const VALID_PRIORITIES: ReadonlyArray<string> = ['low', 'normal', 'high'];

interface TaskNotesConfig {
    tasksFolder: string;
    taskTag: string;
    defaultTaskPriority: 'low' | 'normal' | 'high';
    defaultTaskStatus: string;
    taskFilenameFormat: string;
    storeTitleInFilename: boolean;
    customFilenameTemplate: string;
    fieldMapping: {
        scheduled: string;
        contexts: string;
    };
}

function isTaskNotesConfig(value: unknown): value is TaskNotesConfig {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    const fm = v['fieldMapping'] as Record<string, unknown> | undefined;
    return (
        typeof v['tasksFolder'] === 'string' &&
        typeof v['taskTag'] === 'string' &&
        VALID_PRIORITIES.includes(v['defaultTaskPriority'] as string) &&
        typeof v['defaultTaskStatus'] === 'string' &&
        typeof v['taskFilenameFormat'] === 'string' &&
        typeof v['storeTitleInFilename'] === 'boolean' &&
        typeof v['customFilenameTemplate'] === 'string' &&
        typeof fm?.['scheduled'] === 'string' &&
        typeof fm?.['contexts'] === 'string'
    );
}

export async function loadTaskNotesConfig(app: App): Promise<TaskNotesConfig | null> {
    try {
        const raw = await app.vault.adapter.read(`${app.vault.configDir}/${TASKNOTES_PLUGIN_DATA}`);
        const parsed: unknown = JSON.parse(raw);
        return isTaskNotesConfig(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function resolveEffectiveSettings(
    settings: TaskShelfSettings,
    tn: TaskNotesConfig | null,
): EffectiveSettings {
    const taskFolderPath =
        settings.taskFolderPath !== DEFAULT_SETTINGS.taskFolderPath
            ? settings.taskFolderPath
            : (tn?.tasksFolder ?? DEFAULT_SETTINGS.taskFolderPath);

    const defaultPriority =
        settings.defaultPriority !== DEFAULT_SETTINGS.defaultPriority
            ? settings.defaultPriority
            : (tn?.defaultTaskPriority ?? DEFAULT_SETTINGS.defaultPriority);

    const defaultStatus =
        settings.defaultStatus !== DEFAULT_SETTINGS.defaultStatus
            ? settings.defaultStatus
            : (tn?.defaultTaskStatus ?? DEFAULT_SETTINGS.defaultStatus);

    const scheduledPropertyName =
        settings.scheduledPropertyName !== DEFAULT_SETTINGS.scheduledPropertyName
            ? settings.scheduledPropertyName
            : (tn?.fieldMapping?.scheduled ?? DEFAULT_SETTINGS.scheduledPropertyName);

    const contextPropertyName =
        settings.contextPropertyName !== DEFAULT_SETTINGS.contextPropertyName
            ? settings.contextPropertyName
            : (tn?.fieldMapping?.contexts ?? DEFAULT_SETTINGS.contextPropertyName);

    const rawFormat = tn?.taskFilenameFormat ?? 'custom';
    const filenameFormat: 'zettel' | 'custom' = rawFormat === 'zettel' ? 'zettel' : 'custom';

    return {
        ...settings,
        taskFolderPath,
        defaultPriority,
        defaultStatus,
        scheduledPropertyName,
        contextPropertyName,
        taskTag: tn?.taskTag ?? 'task',
        filenameFormat,
        storeTitleInFilename: tn?.storeTitleInFilename ?? true,
        customFilenameTemplate: tn?.customFilenameTemplate ?? '{title}',
    };
}
