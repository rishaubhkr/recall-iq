# Cloze Fuzzy Matching Plan

## Objective
Implement a more robust string comparison for Cloze cards to handle cases like "7" vs "seven", punctuation differences, and extra whitespace. This improves user experience by accepting correct answers that vary slightly in formatting or representation.

## 1. Implement Normalization Utility (`frontend-specialist`)
- Create a `fuzzyNormalize` helper function in `src/components/cards/ClozeCard.tsx`.
- The function will:
    - Trim and lowercase the input.
    - Remove punctuation (e.g., `.`, `,`, `!`, `?`).
    - Standardize whitespace (multiple spaces to one).
    - Convert number words (0-10) to digits (e.g., "seven" -> "7") to handle numeric/word equivalence.

## 2. Update Comparison Logic (`frontend-specialist`)
- Update the `handleCheck` function in `ClozeCard.tsx` to use `fuzzyNormalize` for both the user input and the correct answer.
- This ensures that if the answer is "seven" and the user types "7", it will be marked as correct.

## 3. Verification (`test-engineer`)
- Manually test with:
    - Numeric vs word: "7" vs "seven".
    - Punctuation: "seven." vs "seven".
    - Capitalization: "Seven" vs "seven".
- Run linting.

## Execution Strategy
- Direct update to `ClozeCard.tsx`.
- No changes needed to the data model or backend.
