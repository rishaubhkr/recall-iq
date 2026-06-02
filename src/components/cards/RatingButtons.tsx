"use client";

interface RatingButtonsProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  wasCorrect?: boolean;
}

const RATINGS = [
  { value: 1 as const, label: "Again", sub: "Forgot", emoji: "✗" },
  { value: 2 as const, label: "Hard", sub: "Struggled", emoji: "~" },
  { value: 3 as const, label: "Good", sub: "Recalled", emoji: "✓" },
  { value: 4 as const, label: "Easy", sub: "Instant", emoji: "⚡" },
];

export function RatingButtons({ onRate, wasCorrect }: RatingButtonsProps) {
  return (
    <div>
      {wasCorrect !== undefined && (
        <p style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: wasCorrect ? "var(--success)" : "var(--error)",
          marginBottom: "0.75rem",
          fontWeight: 600,
        }}>
          {wasCorrect ? "✓ Correct — how easy was it?" : "✗ Incorrect — rate your recall attempt"}
        </p>
      )}
      <div className="rating-grid">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            className="rating-btn"
            data-rating={r.value}
            onClick={() => onRate(r.value)}
            aria-label={`Rate as ${r.label}`}
          >
            <span style={{ fontSize: "1.1rem" }}>{r.emoji}</span>
            <span style={{ fontWeight: 700 }}>{r.label}</span>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 400 }}>{r.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
