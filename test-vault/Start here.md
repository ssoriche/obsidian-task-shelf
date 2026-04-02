# Task Shelf — test vault

## Setup

Both plugins are pre-installed and enabled:
- **TaskNotes** (callumalpass/tasknotes) — note-based task management
- **Task Shelf** — quick-capture modal (this plugin)

## Testing task-shelf

1. Open the command palette (`Cmd+P`) and run **Task shelf: Open**
2. Fill in a task title
3. Click **Choose...** to pick a context note
   - The scheduled date should auto-fill with the nearest future meeting date
4. The source field should auto-fill with this note's name
5. Click **Create task** — a new file appears in `TaskNotes/Tasks/`

## Sample notes

### ISO-dated pattern (`\d{4}-\d{2}-\d{2}`)

- `Meetings/1-1 with Alice` — MOC with ISO-date wikilinks (`[[2026-04-07]]`); should appear in context picker
- `Meetings/Team standup` — MOC with ISO-date wikilinks; should appear in context picker
- `Meetings/2026-03-31` — ISO-dated instance note; should be **excluded** from context picker

### Folder-path pattern (`^\d{2}-\d{2}-`)

- `Meetings/Core Weekly/Core Weekly MOC` — MOC with folder-path wikilinks (`[[2026/04-April/04-08-Wednesday Core Weekly]]`); should appear in context picker; scheduled should auto-fill `2026-04-08`
- `Meetings/Core Weekly/2026/04-April/04-01-Wednesday Core Weekly` — past instance; excluded from picker
- `Meetings/Core Weekly/2026/04-April/04-08-Wednesday Core Weekly` — next upcoming instance; excluded from picker
- `Meetings/Core Weekly/2026/04-April/04-15-Wednesday Core Weekly` — future instance; excluded from picker

- `Meetings/Design Review/Design Review MOC` — MOC whose individual meeting files **do not exist yet**; date auto-fill should still work from the link path alone

The test vault is pre-configured with `contextExcludePattern` set to `\d{4}-\d{2}-\d{2}|^\d{2}-\d{2}-` so both exclusion styles work simultaneously.
