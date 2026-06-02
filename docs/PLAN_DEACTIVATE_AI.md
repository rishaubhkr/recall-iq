# Feature Deactivation: Magic AI Generator

The user has requested to turn off the AI Magic Generate feature for now. This involves removing the UI entry points while keeping the underlying infrastructure intact for future use.

## Proposed Changes

### [Frontend] UI Deactivation
#### [MODIFY] [new/page.tsx](file:///r:/nazo/recalliq/src/app/(admin)/admin/cards/new/page.tsx)
- Remove the `MagicGenerate` component import and the button rendering in the header.

### [Backend] Action Retention
- The `convex/ai.ts` file will be kept as-is, but will no longer be reachable from the main Admin UI flow.

---

## Verification Plan

### Manual Verification
- Navigate to **Admin → Cards → New Card**.
- Confirm that the ✨ **Magic AI Generate** button is no longer visible in the header.
- Confirm the card creation form still works manually.
