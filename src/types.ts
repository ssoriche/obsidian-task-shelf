export interface TaskShelfSettings {
    taskFolderPath: string;
    contextFolderPath: string;
    contextExcludePattern: string;
    defaultPriority: 'low' | 'medium' | 'high';
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
    defaultPriority: 'medium',
    defaultStatus: 'todo',
    sourcePropertyName: 'source',
    contextPropertyName: 'context',
    scheduledPropertyName: 'scheduled',
    autoFillSourceFromActiveFile: true,
};

export interface TaskData {
    title: string;
    status: string;
    priority: 'low' | 'medium' | 'high';
    source: string;       // wikilink string, e.g., "[[Some Note]]"
    context: string;      // wikilink string, e.g., "[[1:1 with Alice]]"
    scheduled: string;    // ISO date string, e.g., "2026-04-03"
}
