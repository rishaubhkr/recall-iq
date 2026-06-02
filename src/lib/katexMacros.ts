/**
 * KaTeX macro definitions for JEE/NEET/GATE — common physics, chemistry, maths notation.
 * Import and pass to KaTeX options or react-katex macros prop.
 */
export const JEE_KATEX_MACROS: Record<string, string> = {
  // ─── Physics ──────────────────────────────────────────────────────────────
  "\\hbar":    "\\hbar",
  "\\kB":      "k_{\\text{B}}",               // Boltzmann constant
  "\\NA":      "N_{\\text{A}}",               // Avogadro's number
  "\\eps0":    "\\varepsilon_0",              // permittivity of free space
  "\\mu0":     "\\mu_0",                      // permeability
  "\\grad":    "\\vec{\\nabla}",
  "\\curl":    "\\vec{\\nabla} \\times",
  "\\divg":    "\\vec{\\nabla} \\cdot",
  "\\laplacian": "\\nabla^2",
  "\\ddt":     "\\frac{d}{dt}",
  "\\dddx":    "\\frac{d}{dx}",
  "\\pdt":     "\\frac{\\partial}{\\partial t}",
  "\\pdx":     "\\frac{\\partial}{\\partial x}",
  "\\ihat":    "\\hat{\\imath}",
  "\\jhat":    "\\hat{\\jmath}",
  "\\khat":    "\\hat{k}",
  "\\rhat":    "\\hat{r}",
  "\\cross":   "\\times",
  "\\magfield":"\\vec{B}",
  "\\elecfield":"\\vec{E}",

  // ─── Maths ────────────────────────────────────────────────────────────────
  "\\RR":      "\\mathbb{R}",
  "\\ZZ":      "\\mathbb{Z}",
  "\\NN":      "\\mathbb{N}",
  "\\CC":      "\\mathbb{C}",
  "\\implies": "\\Rightarrow",
  "\\iff":     "\\Leftrightarrow",
  "\\then":    "\\Rightarrow",
  "\\lim":     "\\lim",
  "\\to":      "\\to",
  "\\infty":   "\\infty",
  "\\abs":     "\\left|#1\\right|",
  "\\norm":    "\\left\\|#1\\right\\|",
  "\\set":     "\\left\\{#1\\right\\}",
  "\\floor":   "\\left\\lfloor #1 \\right\\rfloor",
  "\\ceil":    "\\left\\lceil #1 \\right\\rceil",
  "\\half":    "\\frac{1}{2}",
  "\\third":   "\\frac{1}{3}",

  // ─── Chemistry ───────────────────────────────────────────────────────────
  "\\rxn":     "\\rightarrow",
  "\\eq":      "\\rightleftharpoons",
  "\\conc":    "\\left[#1\\right]",
  "\\degree":  "^{\\circ}",
  "\\DeltaH":  "\\Delta H",
  "\\DeltaG":  "\\Delta G",
  "\\DeltaS":  "\\Delta S",
  "\\Keq":     "K_{\\text{eq}}",
  "\\Ka":      "K_{\\text{a}}",
  "\\Kb":      "K_{\\text{b}}",
  "\\pH":      "\\text{pH}",

  // ─── Common shortcuts ─────────────────────────────────────────────────────
  "\\approx":  "\\approx",
  "\\propto":  "\\propto",
  "\\pm":      "\\pm",
  "\\alpha":   "\\alpha",
  "\\beta":    "\\beta",
  "\\gamma":   "\\gamma",
  "\\theta":   "\\theta",
  "\\omega":   "\\omega",
  "\\lambda":  "\\lambda",
  "\\sigma":   "\\sigma",
  "\\rho":     "\\rho",
  "\\tau":     "\\tau",
  "\\phi":     "\\phi",
  "\\psi":     "\\psi",
  "\\Delta":   "\\Delta",
  "\\nabla":   "\\nabla",
  "\\partial": "\\partial",
};
