# 🧠 Personal Question Bank Integration Plan

## Task: Staging Area Importer for Student-Generated Cards

### Context
Students will use an AI (ChatGPT/Claude) outside the app using our "Master Prompt" to generate a TSV of cognitive science flashcards. They will paste this TSV into a "Staging Area" in their personal space. The system will preview the cards, allow edits, and save them into the existing `cards` table, seamlessly mixing them into their daily FSRS review queue.

### Core Decisions
- **Option C Strategy**: Implement a TSV staging area with a live preview before committing to the database.
- **P0 - Same Table**: Personal cards will be stored directly in the global `cards` table to reuse the existing study engine. We will add an `ownerId` (Clerk User ID) to the schema to sandbox personal cards.
- **P1 - Mixed Review Queue**: Personal cards will organically enter the FSRS scheduled review loop alongside official curriculum cards.
- **P3 - Dynamic Prompting**: The UI will provide an input field (e.g., "What are you studying?") and dynamically inject it into the copy-pasteable "Master Prompt" to yield higher quality AI outputs.

---

## 🛠️ Task Breakdown

### Phase 1: Database Schema Expansion
- Update `convex/schema.ts` to support personal content:
  - Add `ownerId: v.optional(v.string())` to `cards`.
  - Add `ownerId: v.optional(v.string())` and `isPersonal: v.optional(v.boolean())` to `courses` (or create a `decks` table if a flat hierarchy is preferred).
- Update Convex queries/mutations to respect `ownerId` so students can only fetch their own personal cards, while still fetching global `isPublished` cards.

### Phase 2: Dynamic Master Prompt UI
- Create a new route: `src/app/(student)/personal/page.tsx` (or similar).
- Implement a "Prompt Generator" module:
  - Input: Subject/Topic focus.
  - Output: A highly-tuned, copyable string containing the TSV formatting rules (mirroring the admin prompt but optimized for students).
  - Add a "Copy to Clipboard" button.

### Phase 3: The Staging Area & Live Preview
- Create a TSV input `textarea` for students to paste the AI's response.
- Reuse the TSV parsing logic from `admin/import/page.tsx` but run it client-side.
- Render a live preview matrix of parsed cards (showing Front, Back, Type).
- Implement inline deletion (so students can remove AI hallucinations before saving).

### Phase 4: Commit & FSRS Integration
- Create a Convex mutation: `commitPersonalCards` that validates the schema and inserts the cards with the student's `ownerId`.
- Ensure the `getDueCards` FSRS query (or equivalent) in Convex checks for `ownerId === userId || ownerId === undefined` so personal cards are fetched in the global spaced-repetition queue.

---

## 🤖 Agent Assignments

1. **`database-architect`**
   - Goal: Modify Convex schema to safely sandbox `ownerId` without breaking the global study engine. Write the `commitPersonalCards` mutation and update review queue queries.
2. **`frontend-specialist`**
   - Goal: Build the Dynamic Prompt UI, the TSV staging area, and the live preview matrix.
3. **`test-engineer` / `security-auditor`**
   - Goal: Ensure students cannot fetch or delete other students' personal cards via Convex mutations. Verify the FSRS algorithm still schedules correctly with mixed card ownership.

---

## ✅ Verification Checklist
- [ ] Schema updated and Convex deployed successfully.
- [ ] Student can generate a dynamic prompt, paste a TSV, and see a live preview.
- [ ] Invalid TSV rows fail gracefully without breaking the entire preview.
- [ ] Saved cards appear in the user's daily study queue.
- [ ] A student's personal cards are completely invisible to other students.
