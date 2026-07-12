/**
 * Safely replaces escaped newlines (\\n) with real newlines (\n)
 * while keeping LaTeX math blocks ($...$ or $$...$$) completely untouched.
 *
 * This prevents stripping the backslash from commands like \neq, \node, \num, etc.
 */
export function replaceNewlinesOutsideMath(str: string): string {
  if (!str) return "";
  // Split the string by block math ($$...$$) or inline math ($...$) delimiters,
  // capturing the delimiters and the math content inside them.
  const parts = str.split(/(\$\$(?:[^\$]|\\[\s\S])*\$\$|\$(?:[^\$]|\\[\s\S])*\$)/g);
  
  return parts
    .map((part, i) => {
      // Math blocks are matched by the capturing group and end up at odd indices
      if (i % 2 === 1) {
        return part;
      }
      // Non-math segments get standard newline unescaping
      return part.replace(/\\n/g, "\n");
    })
    .join("");
}
