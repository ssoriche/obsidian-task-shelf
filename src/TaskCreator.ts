import { App, TFile } from 'obsidian';
import { TaskData, EffectiveSettings } from './types';

const UNSAFE_FILENAME_CHARS = /[/\\:*?"<>|]/g;

function sanitizeFilename(title: string): string {
    return title.replace(UNSAFE_FILENAME_CHARS, '-').trim();
}

/** Escape a string value for safe embedding in YAML frontmatter. */
function yamlScalar(value: string): string {
    return JSON.stringify(value);
}

export function buildFrontmatter(settings: EffectiveSettings, data: TaskData): string {
    const lines: string[] = ['---'];

    lines.push(`title: ${yamlScalar(data.title)}`);
    lines.push(`status: ${yamlScalar(data.status)}`);
    lines.push(`priority: ${yamlScalar(data.priority)}`);
    lines.push(`tags: [${yamlScalar(settings.taskTag)}]`);

    if (data.source) {
        lines.push(`${settings.sourcePropertyName}: ${yamlScalar(data.source)}`);
    }
    if (data.context) {
        lines.push(`${settings.contextPropertyName}: ${yamlScalar(data.context)}`);
    }
    if (data.scheduled) {
        lines.push(`${settings.scheduledPropertyName}: ${yamlScalar(data.scheduled)}`);
    }

    lines.push('---');
    lines.push('');
    return lines.join('\n');
}

export function generateBaseName(title: string, settings: EffectiveSettings): string {
    const safe = sanitizeFilename(title);
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');

    if (settings.filenameFormat === 'zettel') {
        const now = new Date();
        const timestamp =
            String(now.getFullYear()) +
            pad(now.getMonth() + 1) +
            pad(now.getDate()) +
            pad(now.getHours()) +
            pad(now.getMinutes());
        if (!settings.storeTitleInFilename || safe.length === 0) return timestamp;
        return `${timestamp} ${safe}`;
    }

    if (settings.filenameFormat === 'custom') {
        const now = new Date();
        const isoDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const rendered = settings.customFilenameTemplate
            .replace(/\{date\}/g, isoDate)
            .replace(/\{title\}/g, safe);
        const normalized = sanitizeFilename(rendered);
        return normalized.length > 0 ? normalized : 'untitled';
    }

    return safe;
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

    const MAX_ATTEMPTS = 1000;
    for (let counter = 2; counter <= MAX_ATTEMPTS; counter++) {
        const candidate = `${folderPath}/${baseName} (${counter}).md`;
        if (!app.vault.getAbstractFileByPath(candidate)) return candidate;
    }

    throw new Error(`Could not find a free filename for "${baseName}" after ${MAX_ATTEMPTS} attempts`);
}

export async function create(app: App, settings: EffectiveSettings, data: TaskData): Promise<TFile> {
    const content = buildFrontmatter(settings, data);
    const baseName = generateBaseName(data.title, settings);

    await ensureFolder(app, settings.taskFolderPath);

    const filePath = resolveFilePath(app, settings.taskFolderPath, baseName);
    return await app.vault.create(filePath, content);
}
