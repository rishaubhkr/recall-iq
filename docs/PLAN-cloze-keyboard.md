# PLAN: Multi-Blank Cloze Parsing & JEE Virtual Symbol Keyboard

## 🎯 Goal
Refactor `ClozeCard.tsx` to:
1. Parse **multiple inline blanks** inside a single template (e.g. `{{c1::\sqrt{3}/2}}` and `{{c2::\sqrt{3}}}`).
2. Render separate text segments and input fields inline in the UI.
3. Provide an interactive **HUD Math Keyboard** directly below the active input field for typing JEE math symbols easily.
4. Enhance `fuzzyNormalize` to handle mathematical equivalents (e.g. `\sqrt{3}`, `root3`, `√3`, `root(3)`).

---

## 🎨 Proposed Changes

### [Frontend] Card Refactoring
#### [MODIFY] [ClozeCard.tsx](file:///r:/recalliq/recalliq/src/components/cards/ClozeCard.tsx)

1. **Multi-Blank Parsing (`parseClozeTokens`):**
   Replace the single-split `parseCloze` function with a tokenizer:
   ```typescript
   type ClozeToken = 
     | { type: "text"; content: string }
     | { type: "blank"; index: number; answer: string; key: string };
   ```
   Splits the template globally by regex: `/(?:\[\[|\{\{(?:c\d::)?)(.+?)(?:\]\]|\}\})/g`.

2. **State Management:**
   - Track `userInputs: Record<number, string>` (map of blank index to student's typed value).
   - Track `activeInputIndex: number | null` (to know which input should receive key-tap characters).
   - Track `revealed: boolean`.
   - Track `isCorrectMap: Record<number, boolean>` (individual correctness).

3. **JEE HUD Mathematical Keyboard:**
   When an input field is focused, display a small glowing Amber symbol bar containing quick-tap buttons:
   - `√` (inserts `\sqrt{}`)
   - `/` (inserts division)
   - `^` (inserts superscript)
   - `π` (inserts pi)
   - `θ` (inserts theta)
   - `(` and `)`
   Tapping a symbol inserts it at the current selection cursor in the active input field.

4. **Fuzzy Equation Normalizer (`fuzzyNormalize`):**
   Enrich comparison rules:
   - Normalize square root formats: replace `\sqrt{`, `\sqrt`, `√`, `root(`, `root` with `root`.
   - Remove backslashes, braces, spaces, parentheses, and standard punctuation.
   - Example equivalence: `\sqrt{3}/2` ➔ `root3/2` ➔ `√3/2` ➔ `root3/2`.

---

## 📅 Task Breakdown
- [ ] Create robust regex-based global tokenizer for `ClozeCard.tsx`.
- [ ] Refactor render code to map tokens inline (rendering input elements in-line with text).
- [ ] Implement the `HUD Keyboard` UI with state hooks to track cursor positions and handle focus.
- [ ] Update `fuzzyNormalize` to compare equations cleanly.

---

## ⏸️ CHECKPOINT
> **Do you approve this plan?**
> - **Y** ➔ I'll start implementing right away.
