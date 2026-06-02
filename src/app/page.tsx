import type { Metadata } from "next";
import InteractiveLanding from "@/components/landing/InteractiveLanding";

export const metadata: Metadata = {
  title: "RecallIQ — Science-Backed JEE, NEET & GATE Memorization",
  description:
    "Master JEE, NEET & GATE Physics, Chemistry, and Maths using cognitive science techniques — spaced repetition, active recall, interleaving, and FSRS v5.",
  openGraph: {
    title: "RecallIQ — Science-Backed Exam Memorization",
    description: "Master JEE, NEET & GATE using spaced repetition and FSRS v5.",
    type: "website",
  },
};

export default function Home() {
  return <InteractiveLanding />;
}
