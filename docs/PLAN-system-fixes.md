# Comprehensive Fix: Convex Server Error & Cloze Rendering

## Objective
1. Fix the `TypeError: dynamic module import unsupported` error in Convex by relocating the FSRS library.
2. Fix the Cloze card rendering issue where Anki-style syntax `{{c1::answer}}` is not recognized by the component.

## 1. Convex Backend Fixes (`backend-specialist`)
- **Relocate FSRS Library**: Move `src/lib/fsrs.ts` to `convex/fsrs.ts` to allow standard imports in the Convex runtime.
- **Update `convex/reviews.ts`**:
    - Replace dynamic `await import()` with a top-level `import { retrievability } from "./fsrs"`.
    - Ensure all scheduling logic uses the imported library correctly.

## 2. Frontend Cloze Rendering Fix (`frontend-specialist`)
- **Update `ClozeCard.tsx` Parser**:
    - Modify the `parseCloze` function to support both Anki-style `{{c1::answer}}` and the existing `[[answer]]` syntax.
    - Updated Regex: `/^([\s\S]*?)(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})([\s\S]*)$/`
- **Update Context Rendering**:
    - Ensure the "Context Area" also hides the cloze using the same regex pattern.

## 3. Verification (`test-engineer`)
- **Backend**: Run `npx convex dev` and record a review to verify the server error is gone.
- **Frontend**: Load a card with `{{c1::answer}}` syntax and verify it renders as a blank input.

## Execution Strategy
- Sequential implementation starting with the backend relocation.
- Final validation of the study loop.
