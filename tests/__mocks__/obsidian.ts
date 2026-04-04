// Minimal stubs so source files that import 'obsidian' can be loaded in tests.
export class App {}
export class TFile {}
export class Modal { app: App; constructor(app: App) { this.app = app; } }
export class FuzzySuggestModal<_T> { app: App; constructor(app: App) { this.app = app; } }
export class Notice { constructor(_msg: string) {} }
export class Setting { constructor(_container: HTMLElement) {} }
