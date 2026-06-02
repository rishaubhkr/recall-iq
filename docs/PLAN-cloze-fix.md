# Cloze & MCQ Field Support Plan

## Objective
Fix the Bulk Import table to support `cloze` and `mcq` card types by displaying their specific fields (`clozeTemplate`, `options`, `correctOption`) and updating validation logic.

## 1. Validation Logic Update (`frontend-specialist`)
- Update `validateRow` in `src/app/(admin)/admin/import/page.tsx`.
- For `cloze`: Require `clozeTemplate`. `front`/`back` can be optional (or we can auto-generate them, but for now just validate `clozeTemplate`).
- For `mcq`: Require `front`, `options`, and `correctOption`.

## 2. UI Table Enhancement (`frontend-specialist`)
- Modify the table row renderer in `src/app/(admin)/admin/import/page.tsx`.
- Add conditional fields based on the selected `type`:
  - If `cloze`: Show `clozeTemplate` instead of (or alongside) `front`/`back`.
  - If `mcq`: Show `options` and `correctOption` inputs.
- Ensure the table remains readable by using flexible layouts or context-aware inputs.

## 3. Verification (`test-engineer`)
- Run linting.
- Verify that pasting `cloze` data now shows the content in the UI and passes validation.

## Execution Strategy
- Update the `validateRow` function first.
- Refactor the table body to handle conditional inputs for `mcq` and `cloze` specific fields.
