import { App, TFile } from 'obsidian';
import * as chrono from 'chrono-node';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_IN_LINK_RE = /(\d{4}-\d{2}-\d{2})/;

function toISODateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function resolve(input: string): string | null {
    if (ISO_DATE_RE.test(input)) {
        return input;
    }
    const parsed = chrono.parseDate(input, new Date(), { forwardDate: true });
    if (!parsed) return null;
    return toISODateString(parsed);
}

export async function getNextDateFromMOC(app: App, mocFile: TFile): Promise<string | null> {
    const cache = app.metadataCache.getFileCache(mocFile);
    if (!cache?.links) return null;

    const today = toISODateString(new Date());

    const futureDates = cache.links
        .flatMap((link) => {
            const sources = [link.link, link.displayText ?? ''];
            return sources.flatMap((s) => {
                const match = DATE_IN_LINK_RE.exec(s);
                const captured = match?.[1];
                return captured ? [captured] : [];
            });
        })
        .filter((date) => date >= today);

    if (futureDates.length === 0) return null;

    futureDates.sort();
    return futureDates[0] ?? null;
}
