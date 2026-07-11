const NUMBER_WORDS: Record<string, string> = {
  "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
  "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10"
};

export function fuzzyNormalize(s: string): string {
  let val = s.trim().toLowerCase();
  
  // Standardize square root representations
  val = val.replace(/(?:\\sqrt\s*\{|\\sqrt\s*|√|sqrt\(|root\(|root)/g, "root");
  
  // Standardize pi
  val = val.replace(/(?:\\pi|π)/g, "pi");
  
  // Standardize theta
  val = val.replace(/(?:\\theta|θ)/g, "theta");
  
  // Remove spaces, backslashes, braces, parentheses, and punctuation
  val = val.replace(/[\s\\{}()$.,\/#!%\^&\*;:_`~-]/g, "");
  
  // Convert word to number if exists in our map
  return NUMBER_WORDS[val] || val;
}

export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => 
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

export function fuzzyMatch(userInput: string, correctAnswer: string): { isCorrect: boolean, isTypo: boolean } {
  const userNorm = fuzzyNormalize(userInput);
  const correctNorm = fuzzyNormalize(correctAnswer);

  if (userNorm === correctNorm) {
    return { isCorrect: true, isTypo: false };
  }

  // Calculate dynamic threshold
  // e.g. Math.floor(length / 5) capped at 3
  const threshold = Math.min(3, Math.floor(correctNorm.length / 5));
  
  // Only allow typo correction for somewhat longer words (e.g. length > 3)
  if (correctNorm.length > 3) {
    const dist = levenshtein(userNorm, correctNorm);
    if (dist <= threshold) {
      return { isCorrect: true, isTypo: true };
    }
  }

  return { isCorrect: false, isTypo: false };
}
