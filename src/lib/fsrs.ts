/**
 * FSRS v5 Algorithm — Free Spaced Repetition Scheduler
 * Based on the open-source FSRS-5 specification.
 * Ref: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

export type Rating = 1 | 2 | 3 | 4; // Again | Hard | Good | Easy
export type CardState = "new" | "learning" | "review" | "relearning";

export interface FSRSState {
  stability: number;   // S — how long memory persists (days)
  difficulty: number;  // D — intrinsic difficulty 0-10
  reps: number;
  lapses: number;
  state: CardState;
  lastReview: number;  // Unix ms
  nextReview: number;  // Unix ms
}

// FSRS-5 default parameters (w values from the paper)
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102,
  0.5316, 1.0651, 0.0589, 1.5330,  0.1544,
  1.0070, 1.9395, 0.1100, 0.2900,  3.6984,
  0.1100, 2.9898, 0.5100, 0.3451,
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // 0.9 ^ (1 / DECAY) - 1

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Initial stability based on rating (first time seeing a card) */
function initialStability(rating: Rating): number {
  return W[rating - 1];
}

/** Initial difficulty based on rating */
function initialDifficulty(rating: Rating): number {
  return clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10);
}

/** Retrievability — probability of recall given elapsed days and stability */
export function retrievability(elapsedDays: number, stability: number): number {
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
}

/** Interval in days that achieves target retention (default 90%) */
function nextInterval(stability: number, targetRetention = 0.9): number {
  const raw = (stability / FACTOR) * (Math.pow(targetRetention, 1 / DECAY) - 1);
  return Math.max(1, Math.round(raw));
}

/** Difficulty update after a review */
function nextDifficulty(d: number, rating: Rating): number {
  const delta = W[6] * (1 / rating - 1 / 2);
  const raw = d - delta;
  // Mean reversion
  return clamp(raw + W[7] * (W[4] - raw), 1, 10);
}

/** Short-term stability for learning/relearning phases */
function shortTermStability(s: number, rating: Rating): number {
  return s * Math.exp(W[17] * (rating - 3 + W[18]));
}

/** Long-term stability after a successful review */
function longTermStability(
  d: number,
  s: number,
  r: number,
  rating: Rating,
): number {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  return (
    s *
    (Math.exp(W[8]) *
      (11 - d) *
      Math.pow(s, -W[9]) *
      (Math.exp((1 - r) * W[10]) - 1) *
      hardPenalty *
      easyBonus +
      1)
  );
}

/**
 * Main FSRS scheduling function.
 * Given current card state and a rating, returns the next state.
 * Supports personalized W arrays and Bayesian retention multipliers.
 */
export function schedule(
  currentState: FSRSState,
  rating: Rating,
  now: number = Date.now(),
  customW?: number[],
  retentionMultiplier: number = 1.0,
  targetRetention: number = 0.9,
): FSRSState {
  // Use custom W if provided, otherwise default W
  const wArr = customW && customW.length === 19 ? customW : W;
  const elapsedDays = (now - currentState.lastReview) / 86_400_000;

  // Local helper functions using the active W array
  const initStability = (r: Rating) => wArr[r - 1];
  const initDifficulty = (r: Rating) => clamp(wArr[4] - Math.exp(wArr[5] * (r - 1)) + 1, 1, 10);
  
  // Apply retention multiplier to stability calculation
  const nextInt = (s: number, tr = targetRetention) => {
    // Apply multiplier to the effective stability
    const effectiveS = s * retentionMultiplier;
    const raw = (effectiveS / FACTOR) * (Math.pow(tr, 1 / DECAY) - 1);
    return Math.max(1, Math.round(raw));
  };

  const nextDiff = (d: number, r: Rating) => {
    const delta = wArr[6] * (1 / r - 1 / 2);
    const raw = d - delta;
    return clamp(raw + wArr[7] * (wArr[4] - raw), 1, 10);
  };

  const shortTermS = (s: number, r: Rating) => s * Math.exp(wArr[17] * (r - 3 + wArr[18]));
  
  const longTermS = (d: number, s: number, r: number, rtg: Rating) => {
    const hardPenalty = rtg === 2 ? wArr[15] : 1;
    const easyBonus = rtg === 4 ? wArr[16] : 1;
    return (
      s *
      (Math.exp(wArr[8]) *
        (11 - d) *
        Math.pow(s, -wArr[9]) *
        (Math.exp((1 - r) * wArr[10]) - 1) *
        hardPenalty *
        easyBonus +
        1)
    );
  };

  // ----- NEW card -----
  if (currentState.state === "new") {
    const s = initStability(rating);
    const d = initDifficulty(rating);
    const nextState: CardState =
      rating === 1 ? "learning" : rating < 4 ? "learning" : "review";
    const interval = rating < 3 ? 0 : nextInt(s);

    return {
      stability: s,
      difficulty: d,
      reps: 1,
      lapses: 0,
      state: nextState,
      lastReview: now,
      nextReview: now + interval * 86_400_000,
    };
  }

  // ----- LEARNING / RELEARNING -----
  if (
    currentState.state === "learning" ||
    currentState.state === "relearning"
  ) {
    const s = shortTermS(currentState.stability, rating);
    const d = nextDiff(currentState.difficulty, rating);
    const nextState: CardState = rating === 1 ? currentState.state : "review";
    // Short intervals: 1min, 10min, 1day for Again/Hard/Good — graduate on Good+
    const minuteIntervals = [1, 10];
    const interval =
      rating === 1
        ? minuteIntervals[0] * 60_000
        : rating === 2
          ? minuteIntervals[1] * 60_000
          : nextInt(s) * 86_400_000;

    return {
      stability: s,
      difficulty: d,
      reps: currentState.reps + (rating > 1 ? 1 : 0),
      lapses: currentState.lapses + (rating === 1 ? 1 : 0),
      state: nextState,
      lastReview: now,
      nextReview: now + interval,
    };
  }

  // ----- REVIEW -----
  const r = retrievability(elapsedDays, currentState.stability);
  const d = nextDiff(currentState.difficulty, rating);

  if (rating === 1) {
    // Lapse → relearning
    const s = wArr[11] * Math.pow(currentState.stability, -wArr[12]) *
      (Math.pow(currentState.difficulty + 1, wArr[13]) - 1);
    return {
      stability: Math.max(0.1, s),
      difficulty: d,
      reps: currentState.reps,
      lapses: currentState.lapses + 1,
      state: "relearning",
      lastReview: now,
      nextReview: now + 60_000, // 1 minute
    };
  }

  const s = longTermS(d, currentState.stability, r, rating);
  return {
    stability: clamp(s, 0.1, 36500),
    difficulty: d,
    reps: currentState.reps + 1,
    lapses: currentState.lapses,
    state: "review",
    lastReview: now,
    nextReview: now + nextInt(s) * 86_400_000,
  };
}

/** Create default FSRS state for a new card */
export function newCardState(): Omit<FSRSState, "lastReview" | "nextReview"> & {
  lastReview: number;
  nextReview: number;
} {
  const now = Date.now();
  return {
    stability: 0,
    difficulty: 5,
    reps: 0,
    lapses: 0,
    state: "new",
    lastReview: now,
    nextReview: now,
  };
}
