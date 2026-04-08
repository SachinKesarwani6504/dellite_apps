# Component Rules

## Loading State UX
- For any screen that makes API calls, disable all editable form inputs while loading/submitting.
- Disable all primary/secondary actions that can mutate state while loading/submitting.
- Keep disabled state visually clear (for example lower opacity) so users understand input is locked.
- Re-enable inputs/actions only after the request settles.
