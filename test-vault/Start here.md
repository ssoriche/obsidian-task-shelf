# Task Shelf — test vault

## Setup

Both plugins are pre-installed and enabled:
- **TaskNotes** (callumalpass/tasknotes) — note-based task management
- **Task Shelf** — quick-capture modal (this plugin)

## Testing task-shelf

1. Open the command palette (`Cmd+P`) and run **Task shelf: Open**
2. Fill in a task title
3. Click **Choose...** to pick a context note — try "1:1 with Alice" or "Team standup"
   - The scheduled date should auto-fill with the nearest future meeting date
4. The source field should auto-fill with this note's name
5. Click **Create task** — a new file appears in `TaskNotes/Tasks/`

## Sample notes

- `Meetings/1-1 with Alice` — MOC with future meeting dates (should appear in context picker)
- `Meetings/Team standup` — MOC with future meeting dates (should appear in context picker)
- `Meetings/2026-03-31` — dated instance note (should be **excluded** from context picker)
