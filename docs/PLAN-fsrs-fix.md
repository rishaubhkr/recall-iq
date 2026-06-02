# FSRS Dynamic Import Fix Plan

## Objective
Fix the `TypeError: dynamic module import unsupported` error in Convex by replacing the dynamic `await import("../src/lib/fsrs")` with a standard top-level import. Since Convex does not support importing from outside the `convex/` directory, the FSRS library will be moved into the `convex/` folder.

## 1. Relocate FSRS Library (`backend-specialist`)
- Move (or copy) `src/lib/fsrs.ts` to `convex/fsrs.ts`.
- This makes the library natively available to the Convex runtime.

## 2. Update Reviews Logic (`backend-specialist`)
- Modify `convex/reviews.ts`.
- Add `import { retrievability, schedule } from "./fsrs";` at the top of the file.
- Replace the dynamic `const { retrievability } = await import(...)` line with the imported function.
- Ensure any other functions needed (like `schedule`) are also imported and used correctly.

## 3. Verification (`test-engineer`)
- Run `npx convex dev` to ensure the server-side code compiles correctly.
- Verify that recording a review no longer throws the `dynamic module import unsupported` error.

## Execution Strategy
- Standardize on top-level imports for all Convex logic.
- Remove redundant dynamic imports that break the Convex V8 runtime.
