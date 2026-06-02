# PLAN: Landing Page Redesign (Technical HUD & Dream Accomplishment)

## 🎯 Goal
Transform the landing page (`src/app/page.tsx`) into a highly engaging, result-oriented, and visually stunning "Technical HUD / Dream Accomplishment" cockpit. 

---

## 🎨 Design Commitment

- **Style Theme:** Technical HUD & Cyberpunk precision (retaining official **Electric Amber** brand colors).
- **Layout Uniqueness:** Instead of a generic split hero, we will use a **Massive Typographic Header** integrated with a live, animated **Cognitive Memory Network** background and a prominent **Exam Target Selector** (JEE, NEET, GATE).
- **Core Elements:**
  1. **Hero Section:** Centered headline with a live-updating countdown to major exam dates and dynamic background nodes.
  2. **Memory Simulator (Active Recall Mini-Game):** A hands-on demo where students solve a simple physics/math card, rate their confidence, and witness active recall in action.
  3. **Score & Retention Calculator:** Sliders for "Study Hours/Day" and "Review Algorithm (Standard vs. FSRS v5)" displaying simulated score growth and recall rate.
  4. **The Dream Roadmap:** Interactive visual timeline tracking a student's journey from "Day 1: Syllabus Overwhelm" to "Exam Day: Absolute Mastery" (represented by target universities like IIT/AIIMS).
  5. **Make It Stick Principles Grid:** Refactored into a high-tech "Blueprint Matrix" showing how cognitive science maps to their scores.

---

## 🏗️ Technical Architecture & Components

### 1. Interactive Simulator State
- We will build the simulator state in a client-side component (or keep it inline in `src/app/page.tsx` since Next.js supports standard React state).
- **Active Recall Demo Steps:**
  - *Step 1: The Question.* Show a formula question (e.g., Schrodinger equation blank or JEE Physics query) with KaTeX.
  - *Step 2: The Self-Calibration.* Ask the user to rate their confidence (1-5 stars) *before* revealing the answer.
  - *Step 3: The Reveal & Rating.* Reveal the answer + rating buttons (Again, Hard, Good, Easy) which simulates updating their retention.
  - *Step 4: The Result.* Show a personalized "FSRS Projection" (e.g., "Next review scheduled in 4.2 days. Long-term memory strength: 91%").

### 2. Retention Projection Calculator
- Interactive sliders:
  - `Hours of study per day` (1h to 14h)
  - `Algorithm` (Standard Re-reading vs. Spaced Repetition FSRS)
- Live graph or indicator showing:
  - **Memory Retention Rate** after 30 days (Re-reading: ~18%, FSRS: ~90%)
  - **Estimated Mock Score Gain** (e.g., +45% score projection)

### 3. Animated HUD Memory Network
- A lightweight canvas or SVG-based network of nodes that light up/animate when hovered or when simulator state changes. 
- Represents the forgetting curve stabilizing under spaced repetition.

---

## 📅 Task Breakdown

### Phase 1: Interactive Components
- [ ] Create/Update utility helper for KaTeX equation rendering.
- [ ] Build `MemorySimulator` component with interactive steps.
- [ ] Build `RetentionCalculator` component with sliders and output display.

### Phase 2: Page Layout & Copywriting
- [ ] Refactor `src/app/page.tsx` with new layout structure.
- [ ] Implement the target exam selector and countdown timer.
- [ ] Add the "Dream Roadmap" visual timeline.
- [ ] Rewrite the copy to focus on outcomes (e.g., "Stop wasting 80% of study time on re-reading," "Convert effort into ranks").

### Phase 3: Visual Polish & Animations
- [ ] Apply HUD styling: grid backgrounds, monospace numbers, thin glowing borders, and electric amber accents.
- [ ] Add staggered load animations using Framer Motion (or simple CSS keyframes where appropriate for performance).
- [ ] Audit contrast and layout responsive sizes.

---

## 🧪 Verification Plan
- Run `.agent/scripts/checklist.py` to verify build & TS compiling.
- Manually test simulator steps and sliders for smooth UI state updates.
