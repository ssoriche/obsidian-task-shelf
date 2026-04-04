import { App, FuzzySuggestModal, TFile } from 'obsidian';
import { TaskShelfSettings, EffectiveSettings } from './types';

const NEVER_MATCH = /$a/;

export class ContextSuggestModal extends FuzzySuggestModal<TFile> {
    private settings: TaskShelfSettings | EffectiveSettings;
    private onChoose: (file: TFile) => void;

    constructor(app: App, settings: TaskShelfSettings | EffectiveSettings, onChoose: (file: TFile) => void) {
        super(app);
        this.settings = settings;
        this.onChoose = onChoose;
    }

    getItems(): TFile[] {
        const prefix = this.settings.contextFolderPath.replace(/\/$/, '') + '/';

        let excludeRe: RegExp;
        try {
            excludeRe = new RegExp(this.settings.contextExcludePattern);
        } catch {
            excludeRe = NEVER_MATCH;
        }

        return this.app.vault
            .getMarkdownFiles()
            .filter((f) => f.path.startsWith(prefix) && !excludeRe.test(f.basename));
    }

    getItemText(file: TFile): string {
        return file.basename;
    }

    onChooseItem(file: TFile): void {
        this.onChoose(file);
    }
}
