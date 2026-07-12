"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { CardEditor, type CardFormData } from "@/components/admin/CardEditor";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, X } from "lucide-react";
import type { Id } from "../../../../../../convex/_generated/dataModel";

function EditCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardId = searchParams.get("cardId") as Id<"cards"> | null;
  const { convexUser } = useConvexUser();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = useQuery(api.cards.getCard, cardId ? { id: cardId } : "skip");
  const updateCard = useMutation(api.cards.updateCard);
  const path = useQuery(api.subjects.getSubtopicPath, card?.subtopicId ? { subtopicId: card.subtopicId } : "skip");

  const handleSave = async (data: CardFormData) => {
    if (!cardId) return;
    setError(null);
    setIsSaving(true);

    try {
      await updateCard({
        id: cardId,
        type: data.type as any,
        tier: data.tier,
        front: data.front,
        back: data.back,
        options: data.options,
        correctOption: data.correctOption,
        correctOptions: data.correctOptions,
        clozeTemplate: data.clozeTemplate,
        whyPrompt: data.whyPrompt,
        tags: data.tags,
        advancedMetadata: data.advancedMetadata,
      });
      router.push("/admin/cards");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save card.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!cardId) {
    return (
      <div style={{ padding: "2rem", color: "var(--error)", textAlign: "center" }}>
        No Card ID provided.
      </div>
    );
  }

  if (card === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "4rem", justifyContent: "center", color: "var(--text-muted)" }}>
        <Loader2 className="animate-spin" size={20} />
        <span>Loading card details…</span>
      </div>
    );
  }

  if (card === null) {
    return (
      <div style={{ padding: "2rem", color: "var(--error)", textAlign: "center" }}>
        Card not found.
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: 1100, width: "100%", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/admin/cards" className="btn-icon" aria-label="Back">
          <ChevronLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
            Admin · Cards
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Edit Card
          </h1>
        </div>
      </div>

      {path && (
        <div className="glass-card" style={{ marginBottom: "2rem", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Location: <strong style={{ color: "var(--text-primary)" }}>{path}</strong>
          </span>
        </div>
      )}

      {error && (
        <div style={{ padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-sm)", color: "#FCA5A5", fontSize: "0.875rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <X size={16} /> {error}
        </div>
      )}

      <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
        <CardEditor
          initialType={card.type}
          initialFront={card.front}
          initialBack={card.back}
          initialOptions={card.options}
          initialCorrectOption={card.correctOption}
          initialCorrectOptions={card.correctOptions}
          initialClozeTemplate={card.clozeTemplate}
          initialWhyPrompt={card.whyPrompt}
          initialAdvancedMetadata={card.advancedMetadata}
          initialTier={card.tier}
          initialTags={card.tags}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}

export default function EditCardPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "4rem", justifyContent: "center", color: "var(--text-muted)" }}>
        <Loader2 className="animate-spin" size={20} />
        <span>Loading editor…</span>
      </div>
    }>
      <EditCardContent />
    </Suspense>
  );
}
