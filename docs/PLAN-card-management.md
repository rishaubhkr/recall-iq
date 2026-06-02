# Student Card Management Page Plan

## Objective
Create a dedicated "My Cards" page for students to view, filter, and archive cards they no longer wish to study. This allows users to declutter their study sessions by removing content from completed or irrelevant courses.

## 1. Schema Enhancement (`database-architect`)
- Update `convex/schema.ts`.
- Add `isArchived: v.optional(v.boolean())` to the `userCardState` table.
- This ensures that archival state is persisted per-user per-card without deleting valuable progress data.

## 2. Backend Logic (`backend-specialist`)
- Create `convex/userCards.ts`:
    - `getUserCardStats`: Query to fetch all cards the user has interacted with, including their course/subject hierarchy.
    - `toggleArchiveCard`: Mutation to set/unset the `isArchived` flag.
    - `archiveByCourse`: Mutation to archive all cards belonging to a specific course for the user.
- Update `convex/reviews.ts` (getDueCards/getNewCards):
    - Filter out cards where `isArchived` is true.

## 3. Frontend Implementation (`frontend-specialist`)
- Create `src/app/(focus)/cards/page.tsx`:
    - High-fidelity dashboard for card management.
    - Filters for Course, Subject, and Status (Active/Archived).
    - Table view showing card front, last review, stability, and archive actions.
    - Bulk actions (e.g., "Archive all cards in this course").
- Add navigation link to `AdminSidebar.tsx` (or appropriate student navigation).

## 4. Verification (`test-engineer`)
- Verify that archived cards do not appear in study sessions.
- Verify that users can unarchive cards if needed.
- Run linting and performance checks.

## Execution Strategy
- Standardize on archival instead of deletion to preserve history.
- Use the existing course hierarchy logic to group cards for easy filtering.
