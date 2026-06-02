# Final Stabilization: Magic AI Question Generator

We are in the final stage of orchestrating the AI Question Generator. The core system is built, but the model selection and SDK configuration need stabilization for April 2026 standards.

## User Review Required

> [!IMPORTANT]
> **Model Migration**: We are migrating from `gemini-1.5-flash` (deprecated) to `gemini-2.0-flash` or `gemini-2.5-flash` to ensure compatibility with your new `AQ.` prefix credentials.

## Proposed Changes

### [Backend] API Stabilization
#### [MODIFY] [ai.ts](file:///r:/nazo/recalliq/convex/ai.ts)
- Update model identifier to the current stable version (detected as `gemini-2.0-flash` or newer).
- Configure the SDK to target the `v1` stable endpoint if supported by the package version.

### [Frontend] UI Polish & Import Check
#### [MODIFY] [MagicGenerate.tsx](file:///r:/nazo/recalliq/src/components/admin/MagicGenerate.tsx)
- Add a "Success" state after batch import with a transition back to the card list.
- Ensure the progress loader correctly reflects the card creation process.

---

## Verification Plan

### Automated Tests
- Run `.agent/scripts/checklist.py` to ensure overall project health.

### Manual Verification
- **E2E Test**:
    1. Open Admin Panel.
    2. Use Magic AI to generate 5 cards from a Physics text.
    3. Verify JSON parsing handles Gen 2 model responses.
    4. Confirm cards are correctly synced to the Convex database.

---

## Orchestration Details

| Role | Responsibility |
|------|----------------|
| **Project Planner** | Unified coordination and milestone tracking. |
| **Backend Specialist** | Gemini API stabilization & model mapping. |
| **Test Engineer** | E2E validation & console log audit. |
