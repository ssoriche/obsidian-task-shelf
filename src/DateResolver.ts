import { App, TFile } from 'obsidian';
import * as chrono from 'chrono-node';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_IN_LINK_RE = /(\d{4}-\d{2}-\d{2})/;
const FOLDER_DATE_RE = /(\d{4})\/\d{2}-[A-Za-z]+\/(\d{2})-(\d{2})-[A-Za-z]+/;

function toISODateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function resolve(input: string): string | null {
    if (ISO_DATE_RE.test(input)) {
        // Round-trip through Date to reject semantically invalid dates (e.g. 2026-02-30).
        const d = new Date(input + 'T00:00:00');
        if (isNaN(d.getTime()) || toISODateString(d) !== input) return null;
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
            // Strategy 1: ISO date in link text or display text — try each source independently
            // so a syntactically matching but semantically invalid date in link.link doesn't
            // prevent displayText from being tried.
            for (const candidate of [
                DATE_IN_LINK_RE.exec(link.link)?.[1],
                DATE_IN_LINK_RE.exec(link.displayText ?? '')?.[1],
            ]) {
                if (!candidate) continue;
                const validated = resolve(candidate);
                if (validated) return [validated];
            }

            // Strategy 2: extract date from folder structure in the path
            // Works whether or not the target file exists yet.
            // Prefer the resolved vault path (more canonical); fall back to link.link itself.
            // e.g. link.link  = "2026/04-April/04-08-Wednesday Core Weekly"
            // e.g. resolved.path = "Meetings/Core Weekly/2026/04-April/04-08-Wednesday Core Weekly.md"
            const resolved = app.metadataCache.getFirstLinkpathDest(link.link, mocFile.path);
            const pathToMatch = resolved?.path ?? link.link;
            const m = FOLDER_DATE_RE.exec(pathToMatch);
            if (m) {
                const validated = resolve(`${m[1]}-${m[2]}-${m[3]}`);
                if (validated) return [validated];
            }

            return [];
        })
        .filter((date) => date >= today);

    if (futureDates.length === 0) return null;

    futureDates.sort();
    // Length is guaranteed > 0 by the guard above; cast away the undefined.
    return futureDates[0] as string;
}
