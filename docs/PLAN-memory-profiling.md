# Implementation Plan: Memory Profiling & SRS Algorithm Upgrades

This plan designs and implements a robust time-series memory snapshotting database framework and a series of high-priority upgrades to our FSRS v5 spaced-repetition scheduling algorithm to track student memory growth and optimize their learning cycles.

## Proposed Changes

### 1. Database Schema Updates
Add the `memorySnapshots` table and extend the `reviews` table with fields for deeper metrics tracking.

#### [MODIFY] [schema.ts](file:///r:/recalliq/recalliq/convex/schema.ts)
- Add `memorySnapshots` table tracking global and per-subject stability metrics over time.
- Add optional tracking fields to `reviews` table: `stabilityAtReview`, `predictedRecall`, `elapsedDays`, `positionInSession`, and `timeOfDay`.

---

### 2. Core Scheduling Engine Upgrades
Modify the scheduling parameters and constraints to improve learning speed and prevent difficulty traps.

#### [MODIFY] [fsrs.ts](file:///r:/recalliq/recalliq/convex/fsrs.ts)
- **Same-Day Review Handling:** If elapsed days since last review is less than 1.0, update using `shortTermS` instead of long term stability.
- **Difficulty Inflation Fix:** Cap maximum difficulty at 8.5 (instead of 10) and double the mean reversion factor when difficulty exceeds 7.0.
- **Card Type Modifiers:** Add a per-card-type coefficient to scale scheduled stability (recognition vs production recall modifier).
- **Fuzz Factor:** Add a small randomized fuzz of ±10% to calculated intervals to prevent review spikes.

---

### 3. Review Recording & Queueing Upgrades
Capture new metrics during card submission and sort queues by urgent retrievability rather than raw dates.

#### [MODIFY] [reviews.ts](file:///r:/recalliq/recalliq/convex/reviews.ts)
- Update `recordReview` to:
  - Calculate `stabilityAtReview` and `predictedRecall`.
  - Record the card position in session (`completedCardIds.length + 1`).
  - Log UTC hour `timeOfDay`.
  - Pass the card's `type` to the `schedule` engine.
- Update `getDueCards` to:
  - Sort the queue by retrievability (lowest recall probability first).
  - Return `isLeech: true` if `lapses >= 5` for client-side warning/intervention.

---

### 4. Interleaved Session Optimization
Ensure interleaved study sessions prioritize due cards and balance the queue using true spaced repetition rules.

#### [MODIFY] [sessions.ts](file:///r:/recalliq/recalliq/convex/sessions.ts)
- Update `buildInterleavedSession` to separate cards per subject into active due queues and new queues, sorting due cards by retrievability first, and filling up to `cardsPerSubject` limit.

---

### 5. Automated Snapshot Scheduling
Implement daily cron job mapping to compute student retention status.

#### [NEW] [snapshots.ts](file:///r:/recalliq/recalliq/convex/snapshots.ts)
- Mutation `computeDailySnapshots` to compute and write snapshot records for active users.

#### [NEW] [crons.ts](file:///r:/recalliq/recalliq/convex/crons.ts)
- Configure daily 3:00 AM UTC/IST cron executor.

---

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify type safety.
- Run `npx convex dev` in sandbox to verify schema build and resolvers deploy.

### Manual Verification
- Seed test review sessions.
- Run the snapshot builder script manually to ensure it correctly aggregates and logs snapshot records.
