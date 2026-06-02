"use client";

interface ConfidenceRatingProps {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}

const labels = ["", "Guessing", "Unsure", "Somewhat", "Confident", "Certain"];

export function ConfidenceRating({ value, onChange, size = "md" }: ConfidenceRatingProps) {
  const fontSize = size === "sm" ? "1.25rem" : "1.75rem";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            aria-label={`Confidence ${star} — ${labels[star]}`}
            className={`confidence-star ${star <= value ? "filled" : ""}`}
            style={{ fontSize, background: "none", border: "none", padding: 0 }}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && (
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
          {labels[value]}
        </span>
      )}
    </div>
  );
}
