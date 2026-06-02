import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkTheme";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)",
      padding: "1rem",
    }}>
      {/* Brand above the Clerk card */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "2rem",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
        }}>
          Recall<span style={{ color: "var(--accent)" }}>IQ</span>
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.4rem", fontSize: "0.875rem" }}>
          Join free · No credit card needed
        </p>
      </div>

      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
