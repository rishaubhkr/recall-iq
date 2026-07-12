"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { FlashCard } from "@/components/cards/FlashCard";
import { MCQCard } from "@/components/cards/MCQCard";
import { ClozeCard } from "@/components/cards/ClozeCard";
import { NumericalEntryCard } from "@/components/cards/NumericalEntryCard";
import { MultiSelectCard } from "@/components/cards/MultiSelectCard";
import { AssertionReasonCard } from "@/components/cards/AssertionReasonCard";
import { TrueFalseJustifyCard } from "@/components/cards/TrueFalseJustifyCard";
import { ErrorSpottingCard } from "@/components/cards/ErrorSpottingCard";
import { ConceptInterleaveCard } from "@/components/cards/ConceptInterleaveCard";
import { SequencingCard } from "@/components/cards/SequencingCard";
import { MatrixMatchCard } from "@/components/cards/MatrixMatchCard";
import { ImageOcclusionCard } from "@/components/cards/ImageOcclusionCard";
import { X, ChevronRight, Loader2, Heart, ShieldAlert, BookOpen } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react"; // Added
import type { Id } from "../../../../convex/_generated/dataModel";

const DEMO_CARDS = [
  {
    _id: "demo1" as Id<"cards">,
    type: "flashcard" as const,
    front: "State Newton's Second Law of Motion.",
    back: "$$\\vec{F} = m\\vec{a}$$\n\nNet force equals mass × acceleration.",
    whyPrompt: "This follows from Galileo's inertia observations.",
    tags: ["mechanics"],
  },
];

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div style={{ 
      width: "100%", 
      height: 16, 
      background: "rgba(31, 46, 53, 0.5)", 
      borderRadius: 20, 
      overflow: "hidden", 
      position: "relative" 
    }}>
      <div 
        style={{ 
          height: "100%", 
          width: `${pct}%`, 
          background: "var(--accent)", 
          transition: "width 0.3s ease-out",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden"
        }} 
      >
        {/* Duolingo-style shine/highlight */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "35%",
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: "inherit"
        }} />
      </div>
    </div>
  );
}

type CardDoc = {
  _id: Id<"cards">;
  type: "flashcard" | "mcq" | "cloze" | "elaborative";
  front: string;
  back: string;
  options?: string[];
  correctOption?: number;
  clozeTemplate?: string;
  whyPrompt?: string;
  tags: string[];
};

export default function StudyPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-primary)" }}><Loader2 className="animate-spin" /></div>}>
      <StudyPageContent />
    </Suspense>
  );
}

function StudyPageContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "spaced") as "spaced" | "interleaved" | "subject";

  const courseId = (searchParams.get("courseId") as Id<"courses">) ?? undefined;
  const subjectId = (searchParams.get("subjectId") as Id<"subjects">) ?? undefined;
  const topicId = (searchParams.get("topicId") as Id<"topics">) ?? undefined;
  const subtopicId = (searchParams.get("subtopicId") as Id<"subtopics">) ?? undefined;
  // Fallback for legacy param if any
  const legacySubtopic = (searchParams.get("subtopic") as Id<"subtopics">) ?? undefined;
  
  const subtopicIds = subtopicId || legacySubtopic ? [subtopicId || legacySubtopic!] : undefined;

  const { convexUserId, tier, streak, isLoading: userLoading } = useConvexUser();

  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<Array<{ rating: number; confidence: number; wasCorrect: boolean }>>([]);
  const [done, setDone] = useState(false);
  const [isHeartShaking, setIsHeartShaking] = useState(false);
  const [xpGain, setXpGain] = useState<{ id: number; gain: number } | null>(null);

  const dueQueue = useQuery(
    api.reviews.getDueCards,
    convexUserId ? { userId: convexUserId, subtopicIds, topicId, subjectId, courseId, limit: 100 } : "skip",
  );

  const newQueue = useQuery(
    api.reviews.getNewCards,
    convexUserId ? { userId: convexUserId, subtopicIds, topicId, subjectId, courseId, limit: 100 } : "skip",
  );

  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const BATCH_SIZE = 50;

  const session = useQuery(api.sessions.getSession, sessionId ? { sessionId } : "skip");
  const sessionCardsRaw = useQuery(api.cards.getCardsByIds, session ? { ids: session.cardIds } : "skip");

  const createSession = useMutation(api.sessions.createSession);
  const completeSession = useMutation(api.sessions.completeSession);
  const recordReview = useMutation(api.reviews.recordReview);
  const recordActivity = useMutation(api.users.recordActivity);
  const saveHook = useMutation(api.userCards.saveMentalHook);

  // Group all potential cards into batches
  const allBatches = useMemo(() => {
    if (dueQueue === undefined || newQueue === undefined) return null;
    
    const due = (dueQueue ?? []).map((item) => item.card as unknown as CardDoc);
    const news = (newQueue as unknown as CardDoc[]) || [];
    
    let combined = [];
    if (mode === "spaced") {
      combined = due;
    } else {
      combined = [...due, ...news];
    }
    
    if (combined.length === 0) return [DEMO_CARDS];
    
    // Chunk into batches of 50
    const chunks = [];
    for (let i = 0; i < combined.length; i += BATCH_SIZE) {
      chunks.push(combined.slice(i, i + BATCH_SIZE));
    }
    return chunks;
  }, [dueQueue, newQueue, mode]);

  useEffect(() => {
    if (!convexUserId || sessionId || !allBatches) return;

    const currentBatch = allBatches[currentBatchIndex] || [];
    
    if (currentBatch.length > 0) {
      createSession({
        userId: convexUserId,
        mode,
        cardIds: currentBatch
          .filter((c) => !c._id.toString().startsWith("demo"))
          .map((c) => c._id),
      }).then((id) => setSessionId(id));
    }
  }, [convexUserId, allBatches, currentBatchIndex, sessionId, mode, createSession]);

  let cards = (sessionCardsRaw as unknown as CardDoc[]) || [];
  
  if (cards.length === 0 && sessionCardsRaw !== undefined) {
    cards = DEMO_CARDS;
  }

  const card = cards[currentIdx] as any; 
  const isLoading = userLoading || (sessionId && sessionCardsRaw === undefined) || (!sessionId && (dueQueue === undefined || newQueue === undefined));
  
  const handleSaveHook = async (hook: string) => {
    if (!convexUserId || !card?._id) return;
    await saveHook({ userId: convexUserId, cardId: card._id, hook });
  };

  const handleRate = async (rating: 1 | 2 | 3 | 4, confidence: number, responseMs?: number) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (rating === 1) navigator.vibrate([50, 50, 50]);
      else if (rating === 2) navigator.vibrate([40]);
      else navigator.vibrate([15]);
    }

    const wasCorrect = rating >= 3;
    const newResults = [...results, { rating, confidence, wasCorrect }];
    setResults(newResults);

    // Subtle feedback animations
    if (!wasCorrect) {
      setIsHeartShaking(true);
      setTimeout(() => setIsHeartShaking(false), 500);
    }
    const gain = wasCorrect ? 10 : 2;
    setXpGain({ id: Date.now(), gain });
    setTimeout(() => setXpGain(null), 1000);

    if (convexUserId && sessionId && !card._id.toString().startsWith("demo")) {
      await recordReview({
        sessionId,
        cardId: card._id,
        userId: convexUserId,
        rating,
        confidence,
        wasCorrect,
        responseMs: responseMs ?? 0,
      }).catch(console.error);
    }

    if (currentIdx + 1 >= cards.length) {
      if (sessionId) await completeSession({ sessionId }).catch(console.error);
      if (convexUserId) await recordActivity({ userId: convexUserId }).catch(console.error);
      setDone(true);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1.5rem", background: "var(--bg-primary)" }}>
        <Loader2 size={48} className="animate-spin" style={{ color: "var(--accent)" }} />
        <p style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Loading Session</p>
      </div>
    );
  }

  if (done) {
    const accuracy = results.filter((r) => r.wasCorrect).length / results.length;
    const avgConf = results.reduce((s, r) => s + r.confidence, 0) / results.length;
    const calibrationGap = Math.abs(avgConf / 5 - accuracy);

    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 2rem", background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} className="animate-in">
        <div style={{ fontSize: "5rem", marginBottom: "2rem" }}>🏆</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" }}>Session Complete!</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.25rem", marginBottom: "3rem", textAlign: "center" }}>You reviewed {cards.length} cards today. Keep it up!</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", width: "100%", marginBottom: "4rem" }}>
          {[
            { value: `${Math.round(accuracy * 100)}%`, label: "Accuracy", color: "var(--accent)" },
            { value: avgConf.toFixed(1), label: "Confidence", color: "var(--accent-amber)" },
            { value: streak ?? 1, label: "Day Streak", color: "#FF4B4B" },
          ].map(({ value, label, color }) => (
            <div key={label} className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 600, color }}>{value}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 8 }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link 
            href="/classroom" 
            className="btn btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <BookOpen size={18} /> Back to Syllabus
          </Link>

          {allBatches && currentBatchIndex < allBatches.length - 1 && (
            <button 
              onClick={() => {
                setSessionId(null);
                setCurrentBatchIndex(prev => prev + 1);
                setCurrentIdx(0);
                setResults([]);
                setDone(false);
              }}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Continue to Part {currentBatchIndex + 2} <ChevronRight size={20} />
            </button>
          )}

          <Link href="/analytics" className="btn" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>Review Stats</Link>
          <Link href="/dashboard" className="btn" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* ── TOP BAR (BRANDED AMBER) ── */}
      <div style={{ maxWidth: 1000, width: "100%", margin: "0 auto", padding: "1.5rem 2rem", display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link href="/dashboard" style={{ color: "var(--text-muted)" }} className="hover:text-primary transition-colors">
          <X size={32} />
        </Link>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", justifyContent: "center" }}>
          <ProgressBar current={currentIdx} total={cards.length} />
          {allBatches && allBatches.length > 1 && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Part {currentBatchIndex + 1} of {allBatches.length}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div 
            className={isHeartShaking ? "animate-shake" : ""}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#FF4B4B", fontWeight: 600, fontSize: "1.1rem", background: "rgba(255, 75, 75, 0.1)", padding: "0.4rem 0.8rem", borderRadius: "100px" }}
          >
            <Heart size={20} fill="#FF4B4B" strokeWidth={2.5} /> <span>5</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CANVAS ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 2rem 140px 2rem", maxWidth: 680, width: "100%", margin: "0 auto", position: "relative" }}>
        {xpGain && (
          <div className="animate-float-up" style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", color: "var(--accent)", fontWeight: 600, fontSize: "2rem", pointerEvents: "none", zIndex: 100 }}>
            +{xpGain.gain} XP
          </div>
        )}
        <div key={card._id.toString()} className="animate-in">
          {card.type === "flashcard" && <FlashCard front={card.front} back={card.back} whyPrompt={card.whyPrompt} mentalHook={card.mentalHook} onRate={handleRate} onSaveHook={handleSaveHook} />}
          {card.type === "mcq" && <MCQCard front={card.front} options={card.options!} correctOption={card.correctOption!} back={card.back} onRate={handleRate} />}
          {card.type === "cloze" && <ClozeCard front={card.front} clozeTemplate={card.clozeTemplate!} back={card.back} onRate={handleRate} />}
          {card.type === "elaborative" && <FlashCard front={card.front} back={card.back} whyPrompt={card.whyPrompt} mentalHook={card.mentalHook} onRate={handleRate} onSaveHook={handleSaveHook} />}
          
          {/* New Advanced Types */}
          {card.type === "numerical" && <NumericalEntryCard front={card.front} back={card.back} advancedMetadata={card.advancedMetadata!} onRate={handleRate} />}
          {card.type === "multi_select" && <MultiSelectCard front={card.front} options={card.options!} advancedMetadata={card.advancedMetadata!} back={card.back} onRate={handleRate} />}
          {card.type === "assertion_reason" && <AssertionReasonCard front={card.front} back={card.back} advancedMetadata={card.advancedMetadata!} onRate={handleRate} />}
          {card.type === "true_false_justify" && <TrueFalseJustifyCard front={card.front} back={card.back} advancedMetadata={card.advancedMetadata!} onRate={handleRate} />}
          {card.type === "error_spotting" && <ErrorSpottingCard front={card.front} back={card.back} advancedMetadata={card.advancedMetadata!} onRate={handleRate} />}
          {card.type === "concept_interleave" && <ConceptInterleaveCard front={card.front} back={card.back} onRate={handleRate} />}
          {card.type === "sequencing" && <SequencingCard front={card.front} back={card.back} options={card.options!} advancedMetadata={card.advancedMetadata!} onRate={handleRate} />}
          {card.type === "matrix_match" && <MatrixMatchCard front={card.front} back={card.back} advancedMetadata={card.advancedMetadata!} onRate={handleRate} />}
          {card.type === "image_occlusion" && <ImageOcclusionCard front={card.front} back={card.back} advancedMetadata={card.advancedMetadata!} onRate={handleRate} />}
        </div>
      </div>

      {/* ── STICKY FOOTER (Visual only, buttons are in cards for now) ── */}
      {/* Note: I will gradually move action buttons here for true Duolingo style */}
    </div>
  );
}
