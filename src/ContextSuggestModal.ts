import { App, FuzzySuggestModal, TFile } from 'obsidian';
import { TaskShelfSettings } from './types';

export class ContextSuggestModal extends FuzzySuggestModal<TFile> {
    private settings: TaskShelfSettings;
    private onChoose: (file: TFile) => void;

    constructor(app: App, settings: TaskShelfSettings, onChoose: (file: TFile) => void) {
        super(app);
        this.settings = settings;
        this.onChoose = onChoose;
    }

    getItems(): TFile[] {
        const prefix = this.settings.contextFolderPath + '/';
        const excludeRe = new RegExp(this.settings.contextExcludePattern);

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
