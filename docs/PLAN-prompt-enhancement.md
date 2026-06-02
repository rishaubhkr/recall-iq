# AI Prompt Enhancement Plan

## Objective
Improve the "Master Prompt" on the Bulk Import page to provide the AI with a clear schema reference. This ensures the generated TSV data contains valid values for card types, tiers, and formatting (options, tags).

## 1. Research & Schema Mapping
- **Card Types**: `flashcard`, `mcq`, `cloze`, `elaborative`.
- **Tiers**: `free`, `premium`.
- **MCQ Format**: `options` must be `|` (pipe) separated. `correctOption` is the 0-based index.
- **Cloze Format**: `clozeTemplate` field is required.
- **Tags**: Comma-separated.

## 2. Implementation (`frontend-specialist`)
- Update the `buildPrompt` function in `src/app/(admin)/admin/import/page.tsx`.
- Add a "Schema & Guidelines" section to the prompt string.
- Explain each `type` briefly so the AI knows when to use which.
- Define the constraints for `tier`, `options`, and `tags`.

## 3. Verification (`test-engineer`)
- Run linting on the file.
- Verify the modal displays the updated, detailed prompt in the UI.

## Execution Strategy
- Sequential update to `src/app/(admin)/admin/import/page.tsx`.
- Manual verification of the prompt text.
