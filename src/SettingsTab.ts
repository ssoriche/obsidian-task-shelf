import { App, PluginSettingTab, Setting } from 'obsidian';
import TaskShelfPlugin from './main';

export class SettingsTab extends PluginSettingTab {
    private plugin: TaskShelfPlugin;

    constructor(app: App, plugin: TaskShelfPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setName('Folders').setHeading();

        new Setting(containerEl)
            .setName('Task folder path')
            .setDesc('Folder where new task note files are created.')
            .addText((text) =>
                text
                    .setPlaceholder('TaskNotes/Tasks') // eslint-disable-line obsidianmd/ui/sentence-case
                    .setValue(this.plugin.settings.taskFolderPath)
                    .onChange(async (value) => {
                        this.plugin.settings.taskFolderPath = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Context folder path')
            .setDesc('Folder scanned for context notes shown in the context picker.')
            .addText((text) =>
                text
                    .setPlaceholder('Meetings')
                    .setValue(this.plugin.settings.contextFolderPath)
                    .onChange(async (value) => {
                        this.plugin.settings.contextFolderPath = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Context exclude pattern')
            .setDesc(
                'Regex pattern for context note basenames to exclude. Use \\d{4}-\\d{2}-\\d{2} to hide ISO-dated notes (2026-03-31) or ^\\d{2}-\\d{2}- to hide MM-DD-prefixed notes (10-16-Wednesday Meeting).'
            )
            .addText((text) =>
                text
                    .setPlaceholder('^\\d{2}-\\d{2}-')
                    .setValue(this.plugin.settings.contextExcludePattern)
                    .onChange(async (value) => {
                        this.plugin.settings.contextExcludePattern = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl).setName('Defaults').setHeading();

        new Setting(containerEl)
            .setName('Default priority')
            .setDesc('Priority pre-selected when the capture modal opens.')
            .addDropdown((drop) =>
                drop
                    .addOption('low', 'Low')
                    .addOption('normal', 'Normal')
                    .addOption('high', 'High')
                    .setValue(this.plugin.settings.defaultPriority)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultPriority = value as 'low' | 'normal' | 'high';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Default status')
            .setDesc('Status value written to new task frontmatter.')
            .addText((text) =>
                text
                    .setPlaceholder('todo') // eslint-disable-line obsidianmd/ui/sentence-case
                    .setValue(this.plugin.settings.defaultStatus)
                    .onChange(async (value) => {
                        const trimmed = value.trim();
                        if (!trimmed) return;
                        this.plugin.settings.defaultStatus = trimmed;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl).setName('Frontmatter property names').setHeading();

        new Setting(containerEl)
            .setName('Source property')
            .setDesc('Frontmatter key used for the source link.')
            .addText((text) =>
                text
                    .setPlaceholder('source') // eslint-disable-line obsidianmd/ui/sentence-case
                    .setValue(this.plugin.settings.sourcePropertyName)
                    .onChange(async (value) => {
                        const trimmed = value.trim();
                        if (!trimmed || !/^[A-Za-z0-9_-]+$/.test(trimmed)) return;
                        this.plugin.settings.sourcePropertyName = trimmed;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Context property')
            .setDesc('Frontmatter key used for the context link.')
            .addText((text) =>
                text
                    .setPlaceholder('contexts') // eslint-disable-line obsidianmd/ui/sentence-case
                    .setValue(this.plugin.settings.contextPropertyName)
                    .onChange(async (value) => {
                        const trimmed = value.trim();
                        if (!trimmed || !/^[A-Za-z0-9_-]+$/.test(trimmed)) return;
                        this.plugin.settings.contextPropertyName = trimmed;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName('Scheduled property')
            .setDesc('Frontmatter key used for the scheduled date.')
            .addText((text) =>
                text
                    .setPlaceholder('scheduled') // eslint-disable-line obsidianmd/ui/sentence-case
                    .setValue(this.plugin.settings.scheduledPropertyName)
                    .onChange(async (value) => {
                        const trimmed = value.trim();
                        if (!trimmed || !/^[A-Za-z0-9_-]+$/.test(trimmed)) return;
                        this.plugin.settings.scheduledPropertyName = trimmed;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl).setName('Behaviour').setHeading();

        new Setting(containerEl)
            .setName('Auto-fill source from active file')
            .setDesc('Pre-populate the source field with the currently open note when the modal opens.')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.autoFillSourceFromActiveFile)
                    .onChange(async (value) => {
                        this.plugin.settings.autoFillSourceFromActiveFile = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
