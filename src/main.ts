import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, TaskShelfSettings } from './types';
import { TaskShelfModal } from './TaskShelfModal';
import { SettingsTab } from './SettingsTab';

export default class TaskShelfPlugin extends Plugin {
    settings: TaskShelfSettings;

    async onload() {
        await this.loadSettings();
        await this.ensureTaskFolder();

        this.addCommand({
            id: 'open',
            name: 'Open',
            callback: () => {
                new TaskShelfModal(this.app, this.settings).open();
            },
        });

        this.addSettingTab(new SettingsTab(this.app, this));
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TaskShelfSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async ensureTaskFolder() {
        const folder = this.settings.taskFolderPath;
        if (!this.app.vault.getAbstractFileByPath(folder)) {
            try {
                await this.app.vault.createFolder(folder);
            } catch (err) {
                // Suppress only the TOCTOU race where another process created
                // the folder between our existence check and createFolder call.
                if (err instanceof Error && err.message.toLowerCase().includes('already exists')) {
                    return;
                }
                throw err;
            }
        }
    }
}
