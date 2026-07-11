# Course Card Polish & Real Enrollment Fix Plan

## Goal Description
Refactor the Admin Course Manager card styles (`src/app/(admin)/admin/courses/page.tsx`) and backend stats query (`convex/courses.ts`) to eliminate the unwanted orange/yellow border highlight on hover, fix awkward text wrapping on the modules/cards count (`📦 1 Modules / 0 Cards`), and replace artificial enrollment padding with true real-time student counts.

---

## User Review Required
> [!NOTE]
> **Enrollment Count Accuracy**: We are removing the artificial baseline padding (`+ 24` or `+ 12` students) in `getCourseStats` so that newly created courses or drafts accurately report `0 Students` until real learners enroll.

---

## Proposed Changes

### Admin CMS Frontend

#### [MODIFY] [page.tsx](file:///r:/recalliq/recalliq/src/app/(admin)/admin/courses/page.tsx)
1. **Fix Border Highlight & Button Hover**:
   - In `.course-card:hover` (lines 67-71), replace the orange/amber border highlight (`rgba(245,158,11,0.45)`) and outline shadow with a clean, sophisticated white/slate elevation (`border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.6);`).
   - Remove `.course-card::before` and `.course-card:hover::before` (lines 76-83) which were injecting an amber gradient line at the top edge.
   - Update `.configure-btn:hover` (lines 117-123) to keep a transparent ghost style with a subtle amber border/text instead of flipping to a loud solid yellow background.
2. **Fix `📦 1 Modules / 0 Cards` Layout Wrapping**:
   - In `CourseCardStats` (lines 359-380), switch from a rigid 2-column grid to a flexible wrapping flexbox layout (`display: "flex", flexWrap: "wrap", gap: "1.25rem"`).
   - Add `whiteSpace: "nowrap"` to the module and student stat items so that number and label never wrap onto separate lines.
   - Implement clean singular vs. plural formatting (e.g., `1 Module / 0 Cards` and `1 Student` vs `0 Students`).

### Backend & Database

#### [MODIFY] [courses.ts](file:///r:/recalliq/recalliq/convex/courses.ts)
1. **Fix Students Enrollment Count**:
   - In `getCourseStats` (lines 69-76), remove `baselineStudents` calculation and fake padding (`enrollments.length + 12`).
   - Return actual enrollment count directly: `studentCount: enrollments.length`.

---

## Verification Plan

### Automated Tests
- Run TypeScript compiler validation to ensure zero type errors:
  `npx tsc --noEmit --project tsconfig.json`

### Manual Verification
- Verify course cards no longer glow with an orange/yellow border on hover or focus.
- Verify the Configure button stays a sleek ghost button on hover.
- Verify `📦 1 Module / 0 Cards` displays on a single unbroken line without wrapping "Cards".
- Verify "Physics 11th JEE Advanced Series" and other draft courses accurately report `0 Students`.
