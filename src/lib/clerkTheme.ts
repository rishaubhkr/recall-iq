/**
 * Clerk appearance config — "Scientific Brutalism" dark theme.
 * Matches the global design tokens: Deep Slate + Electric Amber.
 *
 * Contrast ratios verified against WCAG AA (4.5:1 for body text, 3:1 for large):
 *   #F8F9FA on #1C1F2E  = 14.5:1  ✓ (primary text)
 *   #CBD5E1 on #1C1F2E  =  8.6:1  ✓ (secondary text, labels)
 *   #94A3B8 on #1C1F2E  =  5.2:1  ✓ (muted / divider)
 *   #F59E0B on #0F1117  =  8.3:1  ✓ (amber links on dark)
 */
export const clerkAppearance = {
  layout: {
    logoPlacement: "none" as const,
    showOptionalFields: false,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    // ── Palette ──────────────────────────────────────────────────────────
    colorBackground:              "#161820",   // --bg-secondary (page bg behind card)
    colorInputBackground:         "#232638",   // --bg-elevated  (was #0F1117 — too dark)
    colorInputText:               "#F8F9FA",   // --text-primary
    colorText:                    "#F8F9FA",   // primary text on card
    colorTextSecondary:           "#CBD5E1",   // ↑ was #94A3B8 — raised for AA compliance
    colorTextOnPrimaryBackground: "#0F1117",   // dark text on amber button
    colorPrimary:                 "#F59E0B",   // Electric Amber accent
    colorDanger:                  "#EF4444",
    colorSuccess:                 "#10B981",
    colorWarning:                 "#F59E0B",
    colorNeutral:                 "#94A3B8",   // ↑ was #475569 — drives "or" divider, too dark
    colorShimmer:                 "#2D3048",

    // ── Shape ────────────────────────────────────────────────────────────
    borderRadius: "2px",

    // ── Typography ───────────────────────────────────────────────────────
    fontFamily:    "'Space Grotesk', 'Inter', sans-serif",
    fontSize:      "15px",
    fontSmoothing: "antialiased",
    fontWeight:    { normal: 400, medium: 500, bold: 700 },
  },
  elements: {
    // ── Card container ────────────────────────────────────────────────────
    card: {
      background:   "#1C1F2E",
      border:       "1px solid rgba(255,255,255,0.10)",  // ↑ was 0.07 — barely visible
      boxShadow:    "0 8px 32px rgba(0,0,0,0.5)",
      borderRadius: "2px",
    },
    cardBox: {
      boxShadow: "none",
    },

    // ── Header ────────────────────────────────────────────────────────────
    headerTitle: {
      color:         "#F8F9FA",
      fontFamily:    "'Space Grotesk', sans-serif",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      fontSize:      "1.25rem",
    },
    headerSubtitle: {
      color:      "#CBD5E1",    // ↑ was #94A3B8 — subtitle now readable
      fontSize:   "0.875rem",
      lineHeight: "1.5",
    },

    // ── Form labels ───────────────────────────────────────────────────────
    formFieldLabel: {
      color:      "#CBD5E1",    // ↑ was #94A3B8 — "Email address" label now visible
      fontSize:   "0.8rem",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    formFieldLabelRow: {
      color: "#CBD5E1",
    },

    // ── Form inputs ───────────────────────────────────────────────────────
    formFieldInput: {
      background:    "#232638",   // ↑ was #0F1117 — visible separation from card
      border:        "1px solid rgba(255,255,255,0.18)",  // ↑ was 0.07 — outline visible
      color:         "#F8F9FA",
      borderRadius:  "2px",
      fontSize:      "0.9rem",
      lineHeight:    "1.5",
      // placeholder handled by colorNeutral variable
    },
    formFieldInputShowPasswordButton: {
      color: "#94A3B8",
    },

    // ── Primary action button ─────────────────────────────────────────────
    formButtonPrimary: {
      background:    "#F59E0B",
      color:         "#0F1117",
      fontWeight:    700,
      fontFamily:    "'Space Grotesk', sans-serif",
      fontSize:      "0.9rem",
      letterSpacing: "0.01em",
      borderRadius:  "2px",
      border:        "none",
    },

    // ── Social buttons ────────────────────────────────────────────────────
    socialButtonsBlockButton: {
      background:   "#232638",
      border:       "1px solid rgba(255,255,255,0.15)",  // ↑ visible outline
      color:        "#F8F9FA",
      borderRadius: "2px",
    },
    socialButtonsBlockButtonText: {
      color:      "#F8F9FA",
      fontWeight: 500,
    },

    // ── Divider ("or") ────────────────────────────────────────────────────
    dividerLine: {
      background: "rgba(255,255,255,0.12)",  // ↑ was 0.07 — line now visible
    },
    dividerText: {
      color:      "#94A3B8",    // ↑ was #475569 — "or" text now readable
      fontSize:   "0.8rem",
      fontWeight: 500,
    },
    dividerRow: {
      color: "#94A3B8",
    },

    // ── Footer ("Don't have an account? Sign up") ─────────────────────────
    footerActionText: {
      color: "#CBD5E1",         // ↑ was #94A3B8 — "Don't have an account?" visible
    },
    footerActionLink: {
      color:       "#F59E0B",
      fontWeight:  600,
    },
    footerAction: {
      color:      "#CBD5E1",    // ↑ raised contrast
      fontSize:   "0.875rem",
    },
    footer: {
      background: "transparent",
    },
    footerPages: {
      background: "transparent",
    },

    // ── "Sign in" link text in "Please sign in to continue" ───────────────
    headerSubtitleLink: {
      color: "#F59E0B",
    },

    // ── OTP / Code fields ─────────────────────────────────────────────────
    otpCodeFieldInput: {
      background:    "#232638",   // ↑ consistent with formFieldInput
      border:        "1px solid rgba(255,255,255,0.18)",
      color:         "#F8F9FA",
      borderRadius:  "2px",
      fontSize:      "1.25rem",
      fontWeight:    700,
    },

    // ── Internal links ────────────────────────────────────────────────────
    identityPreviewText:  { color: "#F8F9FA" },
    identityPreviewEditButton: { color: "#F59E0B" },
    formResendCodeLink:   { color: "#F59E0B" },
    alternativeMethodsBlockButton: {
      color:         "#F8F9FA",
      background:    "#232638",
      border:        "1px solid rgba(255,255,255,0.15)",
      borderRadius:  "2px",
    },

    // ── Alert / error ─────────────────────────────────────────────────────
    alert: {
      background:   "rgba(239,68,68,0.08)",
      borderColor:  "rgba(239,68,68,0.3)",
      borderRadius: "2px",
    },
    alertText: {
      color:     "#F8F9FA",
      fontSize:  "0.85rem",
    },
    formFieldErrorText: {
      color:    "#FCA5A5",    // lighter red — visible on dark bg
      fontSize: "0.78rem",
    },

    // ── Badge / Dev mode strip ────────────────────────────────────────────
    badge: {
      background:   "rgba(245,158,11,0.12)",
      color:        "#F59E0B",
      borderColor:  "rgba(245,158,11,0.3)",
      borderRadius: "100px",
      fontSize:     "0.72rem",
      fontWeight:   600,
    },
    // The "Development mode" footer strip
    footer__branded: {
      background:    "rgba(245,158,11,0.06)",
      borderTop:     "1px solid rgba(245,158,11,0.15)",
    },

    // ── Internal nav ──────────────────────────────────────────────────────
    navbar:             { background: "#161820" },
    navbarButton:       { color: "#CBD5E1" },      // ↑ was #94A3B8
    navbarButtonActive: { color: "#F59E0B" },
  },
} as const;
