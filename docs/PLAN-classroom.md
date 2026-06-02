# Classroom Feature Implementation Plan

## Objective
Implement a "Classroom" view that displays the hierarchy of a course (Subjects -> Chapters/Topics -> Subtopics) along with card counts. Users can start learning sessions from any level of the tree. The Study mode should correctly restrict retrieval (spaced repetition) to cards that have been learned at least once, while targeted classroom sessions introduce new cards.

## 1. Database & Queries (`database-architect`)
- **Backend Resolution for Reviews**: Modify `getDueCards` and `getNewCards` in `convex/reviews.ts` to accept `courseId`, `subjectId`, `topicId` alongside `subtopicIds`. We will use the same tree-resolution logic we built for `adminListCards` to convert these into a list of valid `subtopicIds` before querying the `user_cards` or `cards` table.
- **Tree with Counts**: Create `getTreeWithCounts` in `convex/subjects.ts` (or expand `getFullTree`) to return the syllabus hierarchy and calculate the total number of cards in each `subtopic` (and roll these counts up to the Topic/Subject level on the client).

## 2. Frontend Classroom UI (`frontend-specialist`)
- **Route**: Create `src/app/(student)/classroom/page.tsx`.
- **Layout**: 
  - Header: Course Name, Total Cards.
  - Body: Expandable Accordion/Cards for each Subject.
  - Inside Subject: List of Topics.
  - Inside Topic: List of Subtopics.
  - **Action**: Each level (Course, Subject, Topic, Subtopic) will have a "Study Node" button linking to `/study?mode=subject&[levelId]=[id]`.
- **Navigation Update**: Modify `src/app/(student)/courses/page.tsx` to link the "Enter Classroom" button to `/classroom?courseId=X` instead of directly to `/study`.

## 3. Study Session Logic (`backend-specialist` / `frontend-specialist`)
- **URL Parameters**: Update `src/app/(focus)/study/page.tsx` to read `courseId`, `subjectId`, `topicId` from the URL and pass them to the `useQuery` hooks for `getDueCards` and `getNewCards`.
- **Retrieval Logic Constraint**: The user requested "only those cards should be there for retrieval which are at least once done from here". 
  - `mode="spaced"` (from Dashboard "Study Now"): This currently uses `getDueCards`, which exclusively pulls from the user's review history. This inherently satisfies the constraint! We just need to ensure `getNewCards` is definitively skipped when in retrieval mode.
  - `mode="subject"` (from Classroom): Pulls both `dueCards` (if due) and `newCards` (to introduce new syllabus).

## Execution Strategy
1. Parallel execution of Backend (Review queries & Tree query) and Frontend (Classroom UI).
2. Final integration test of the Study Session parameter passing.
3. Lint and Build verification (`test-engineer`).
