import { App, TFile } from 'obsidian';
import { TaskData, TaskShelfSettings } from './types';

const UNSAFE_FILENAME_CHARS = /[/\\:*?"<>|]/g;

function sanitizeFilename(title: string): string {
    return title.replace(UNSAFE_FILENAME_CHARS, '-').trim();
}

/** Escape a string value for safe embedding in YAML frontmatter. */
function yamlScalar(value: string): string {
    return JSON.stringify(value);
}

function buildFrontmatter(settings: TaskShelfSettings, data: TaskData): string {
    const lines: string[] = ['---'];

    lines.push(`status: ${yamlScalar(data.status)}`);
    lines.push(`priority: ${yamlScalar(data.priority)}`);
    lines.push('tags: [task]');

    if (data.source) {
        lines.push(`${settings.sourcePropertyName}: ${yamlScalar(data.source)}`);
    }
    if (data.context) {
        lines.push(`${settings.contextPropertyName}: ${yamlScalar(data.context)}`);
    }
    if (data.scheduled) {
        lines.push(`${settings.scheduledPropertyName}: ${data.scheduled}`);
    }

    lines.push('---');
    lines.push('');
    return lines.join('\n');
}

async function ensureFolder(app: App, folderPath: string): Promise<void> {
    if (!app.vault.getAbstractFileByPath(folderPath)) {
        try {
            await app.vault.createFolder(folderPath);
        } catch (err) {
            if (err instanceof Error && err.message.toLowerCase().includes('already exists')) {
                return;
            }
            throw err;
        }
    }
}

function resolveFilePath(app: App, folderPath: string, baseName: string): string {
    const base = `${folderPath}/${baseName}.md`;
    if (!app.vault.getAbstractFileByPath(base)) return base;

    let counter = 2;
    while (true) {
        const candidate = `${folderPath}/${baseName} (${counter}).md`;
        if (!app.vault.getAbstractFileByPath(candidate)) return candidate;
        counter++;
    }
}

export async function create(app: App, settings: TaskShelfSettings, data: TaskData): Promise<TFile> {
    const content = buildFrontmatter(settings, data);
    const baseName = sanitizeFilename(data.title);

    await ensureFolder(app, settings.taskFolderPath);

    const filePath = resolveFilePath(app, settings.taskFolderPath, baseName);
    return await app.vault.create(filePath, content);
}
