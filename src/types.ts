export interface TaskShelfSettings {
    taskFolderPath: string;
    contextFolderPath: string;
    contextExcludePattern: string;
    defaultPriority: 'low' | 'normal' | 'high';
    defaultStatus: string;
    sourcePropertyName: string;
    contextPropertyName: string;
    scheduledPropertyName: string;
    autoFillSourceFromActiveFile: boolean;
}

export const DEFAULT_SETTINGS: TaskShelfSettings = {
    taskFolderPath: 'TaskNotes/Tasks',
    contextFolderPath: 'Meetings',
    contextExcludePattern: '\\d{4}-\\d{2}-\\d{2}',
    defaultPriority: 'normal',
    defaultStatus: 'todo',
    sourcePropertyName: 'source',
    contextPropertyName: 'contexts',
    scheduledPropertyName: 'scheduled',
    autoFillSourceFromActiveFile: true,
};

export interface TaskData {
    title: string;
    status: string;
    priority: 'low' | 'normal' | 'high';
    source: string;       // wikilink string, e.g., "[[Some Note]]"
    context: string;      // wikilink string, e.g., "[[1:1 with Alice]]"
    scheduled: string;    // ISO date string, e.g., "2026-04-03"
}
