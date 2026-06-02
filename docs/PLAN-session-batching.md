# PLAN: Study Session Batching (Scaling 100+ Cards)

## 🎯 Goal
Implement a batching system that splits large subtopics into manageable "Parts" (batches of ~50 cards) to prevent cognitive overload and handle unlimited cards gracefully.

## 🏗️ Architecture
### 1. Batch Calculation Logic
- **Threshold**: 50 cards per batch.
- **Queue Priority**:
    1. **Due Cards**: Always prioritized in the first batch.
    2. **New Cards**: Fills the remaining slots in the first batch, and populates subsequent batches.
- **Example (120 cards total: 30 due, 90 new)**:
    - **Part 1**: 30 Due + 20 New = 50 cards.
    - **Part 2**: 50 New = 50 cards.
    - **Part 3**: 20 New = 20 cards.

### 2. Backend Support (`convex/`)
- **`reviews.ts`**:
    - Enhance `getDueCards` and `getNewCards` to return a larger pool (e.g., 200) so the frontend has enough cards to slice into meaningful batches.
- **`sessions.ts`**:
    - No major changes needed; each batch will be its own `session` in the database.

### 3. Frontend Implementation (`src/app/(focus)/study/page.tsx`)
- **Batch State**: Add `currentBatchIndex` state to track which chunk we are currently studying.
- **Slicing**:
    ```typescript
    const BATCH_SIZE = 50;
    const allCards = [...dueCards, ...newCards];
    const batches = [];
    for (let i = 0; i < allCards.length; i += BATCH_SIZE) {
      batches.push(allCards.slice(i, i + BATCH_SIZE));
    }
    ```
- **Progress Bar**:
    - The main progress bar shows **Batch Progress** (e.g., card 15 of 50).
    - A secondary indicator shows **Total Progress** or "Part 1 of 3".
- **Transition Screen**:
    - If `currentIdx + 1 === cards.length` and `currentBatchIndex < batches.length - 1`:
        - Show a "Continue to Part X" button on the summary screen.
        - Clicking "Continue" increments `currentBatchIndex`, resets `currentIdx` to 0, and clears `results`.

## 📅 Task Breakdown
### Phase 1: Core Logic
- [ ] Refactor `StudyPageContent` to group cards into `batches`.
- [ ] Implement `currentBatchIndex` state and derived `cards` (current batch).
- [ ] Update `useEffect` (session creation) to trigger whenever `currentBatchIndex` changes.

### Phase 2: UI/UX Updates
- [ ] Update `ProgressBar` and session headers to show "Part X of Y".
- [ ] Modify the `Done` screen to detect if more batches are available and show the "Continue" action.

### Phase 3: Verification
- [ ] Test with a topic of 30 cards (Single Part).
- [ ] Test with a topic of 72 cards (Part 1: 50, Part 2: 22).

## ✅ Verification Criteria
- [ ] User can complete a whole topic by clicking "Continue" between batches.
- [ ] Each batch correctly records its own session in the database.
- [ ] Progress in the classroom reflects the total cards completed across all batches.
