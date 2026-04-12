import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import { TaskData, TaskShelfSettings, EffectiveSettings } from './types';
import { ContextSuggestModal } from './ContextSuggestModal';
import { resolve as resolveDate, getNextDateFromMOC } from './DateResolver';
import { create as createTask } from './TaskCreator';
import { loadTaskNotesConfig, resolveEffectiveSettings } from './TaskNotesConfig';

export class TaskShelfModal extends Modal {
    private settings: TaskShelfSettings;
    private effectiveSettings: EffectiveSettings;

    private titleValue = '';
    private contextFile: TFile | null = null;
    private contextValue = '';
    private scheduledValue = '';
    private scheduledManuallyEdited = false;
    private priority: 'low' | 'normal' | 'high';
    private sourceValue = '';

    private contextDisplayEl: HTMLSpanElement | null = null;
    private scheduledInputEl: HTMLInputElement | null = null;
    private resolvedDateEl: HTMLSpanElement | null = null;

    constructor(app: App, settings: TaskShelfSettings) {
        super(app);
        this.settings = settings;
        this.effectiveSettings = resolveEffectiveSettings(settings, null);
        this.priority = this.effectiveSettings.defaultPriority;
    }

    async onOpen() {
        const tnConfig = await loadTaskNotesConfig(this.app);
        this.effectiveSettings = resolveEffectiveSettings(this.settings, tnConfig);
        this.priority = this.effectiveSettings.defaultPriority;

        const { contentEl } = this;
        contentEl.empty();

        this.buildTitleField(contentEl);
        this.buildContextField(contentEl);
        this.buildScheduledField(contentEl);
        this.buildPriorityField(contentEl);
        this.buildSourceField(contentEl);
        this.buildSubmitButton(contentEl);

        this.initSource();
    }

    onClose() {
        this.contentEl.empty();
    }

    private buildTitleField(container: HTMLElement) {
        new Setting(container)
            .setName('Task title')
            .addText((text) => {
                text.setPlaceholder('What needs to be done?')
                    .onChange((value) => { this.titleValue = value; });
                text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Enter') e.preventDefault();
                });
            });
    }

    private buildContextField(container: HTMLElement) {
        const setting = new Setting(container).setName('Context');

        const display = setting.nameEl.createSpan({ cls: 'task-shelf-context-display' });
        display.setText(' — none');
        this.contextDisplayEl = display;

        setting.addButton((btn) => {
            btn.setButtonText('Choose...')
                .onClick(() => {
                    new ContextSuggestModal(this.app, this.effectiveSettings, (file) => {
                        this.onContextChosen(file);
                    }).open();
                });
        });
    }

    private buildScheduledField(container: HTMLElement) {
        const setting = new Setting(container).setName('Scheduled');

        const resolvedSpan = setting.controlEl.createSpan({ cls: 'task-shelf-resolved-date' });
        this.resolvedDateEl = resolvedSpan;

        setting.addText((text) => {
            text.setPlaceholder('Next thursday, or 2026-04-03')
                .onChange((value) => {
                    this.scheduledValue = value;
                    this.scheduledManuallyEdited = true;
                });
            text.inputEl.addEventListener('blur', () => this.updateResolvedDate());
            this.scheduledInputEl = text.inputEl;
        });
    }

    private buildPriorityField(container: HTMLElement) {
        const setting = new Setting(container).setName('Priority');

        const group = setting.controlEl.createDiv({ cls: 'task-shelf-priority-group' });
        const priorities: Array<'low' | 'normal' | 'high'> = ['low', 'normal', 'high'];

        const buttons: HTMLButtonElement[] = [];

        for (const p of priorities) {
            const btn = group.createEl('button', { text: p });
            if (p === this.priority) btn.addClass('is-active');

            btn.addEventListener('click', () => {
                this.priority = p;
                buttons.forEach((b) => b.removeClass('is-active'));
                btn.addClass('is-active');
            });

            buttons.push(btn);
        }
    }

    private buildSourceField(container: HTMLElement) {
        new Setting(container)
            .setName('Source')
            .addText((text) => {
                text.setDisabled(true);
                text.inputEl.id = 'task-shelf-source';
                // value is set in initSource()
            });
    }

    private buildSubmitButton(container: HTMLElement) {
        new Setting(container)
            .addButton((btn) => {
                btn.setButtonText('Create task')
                    .setCta()
                    .onClick(() => { void this.submit(); });
            });
    }

    private initSource() {
        if (!this.effectiveSettings.autoFillSourceFromActiveFile) return;
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;

        this.sourceValue = `[[${activeFile.basename}]]`;

        const input = this.contentEl.querySelector<HTMLInputElement>('#task-shelf-source');
        if (input) input.value = this.sourceValue;
    }

    private onContextChosen(file: TFile) {
        this.contextFile = file;
        this.contextValue = `[[${file.basename}]]`;

        if (this.contextDisplayEl) {
            this.contextDisplayEl.setText(` — ${file.basename}`);
        }

        void this.prefillScheduledFromMOC(file);
    }

    private async prefillScheduledFromMOC(file: TFile) {
        const date = await getNextDateFromMOC(this.app, file);

        // Discard stale result if the user chose a different context
        // while the metadata lookup was in flight.
        if (this.contextFile !== file) return;

        // Don't touch a date the user has typed manually.
        if (this.scheduledManuallyEdited) return;

        if (!date) {
            // New context has no future dates — clear any previously auto-filled date.
            this.scheduledValue = '';
            if (this.scheduledInputEl) this.scheduledInputEl.value = '';
            this.updateResolvedDate();
            return;
        }

        this.scheduledValue = date;
        if (this.scheduledInputEl) {
            this.scheduledInputEl.value = date;
        }
        this.updateResolvedDate();
    }

    private updateResolvedDate() {
        if (!this.resolvedDateEl) return;
        if (!this.scheduledValue.trim()) {
            this.resolvedDateEl.setText('');
            return;
        }
        const resolved = resolveDate(this.scheduledValue);
        this.resolvedDateEl.setText(resolved ? `→ ${resolved}` : '⚠ unrecognised date');
    }

    private async applyLinterIfAvailable(file: TFile): Promise<void> {
        type LinterPlugin = { runLinterFile?: (f: TFile, lintingLastActiveFile?: boolean) => Promise<void> };
        type AppWithPlugins = { plugins?: { plugins?: Record<string, LinterPlugin> } };
        const linter = (this.app as unknown as AppWithPlugins).plugins?.plugins?.['obsidian-linter'];
        if (typeof linter?.runLinterFile === 'function') {
            await linter.runLinterFile(file, false);
        }
    }

    private async submit() {
        if (!this.titleValue.trim()) {
            new Notice('Task title is required');
            return;
        }

        const rawScheduled = this.scheduledValue.trim();
        let resolvedScheduled = '';
        if (rawScheduled) {
            const resolved = resolveDate(rawScheduled);
            if (!resolved) {
                new Notice('Scheduled date could not be parsed — please enter a valid date or clear the field');
                return;
            }
            resolvedScheduled = resolved;
        }

        const data: TaskData = {
            title: this.titleValue.trim(),
            status: this.effectiveSettings.defaultStatus,
            priority: this.priority,
            source: this.sourceValue,
            context: this.contextValue,
            scheduled: resolvedScheduled,
        };

        try {
            const file = await createTask(this.app, this.effectiveSettings, data);
            try {
                await this.applyLinterIfAvailable(file);
            } catch (linterErr) {
                console.warn('obsidian-linter failed on new task file', linterErr);
            }
            new Notice(`Task created: ${file.basename}`);
            this.close();
        } catch (err) {
            new Notice(`Failed to create task: ${String(err)}`);
        }
    }
}
