/**
 * Parses a quickly typed answer key into one letter per question.
 *  - "1a 2b 3c", "1-a, 2-b", "1) c 2) d"  → by question number (gaps stay empty)
 *  - "abcdabcd"                            → one letter per question in order
 */
export const parseAnswerKey = (text: string): (string | undefined)[] => {
  const pairs = [...text.matchAll(/(\d{1,3})\s*[-.):=]?\s*([A-Za-z])/g)];
  if (pairs.length > 0) {
    const result: (string | undefined)[] = [];
    for (const [, number, letter] of pairs) {
      const index = Number(number) - 1;
      if (index >= 0 && index < 100) result[index] = letter.toUpperCase();
    }
    return result;
  }
  return [...text.replace(/[^A-Za-z]/g, '').toUpperCase()];
};

/** Question numbers that still have no (valid) answer, for a precise error message. */
export const findMissingAnswers = (
  answers: (string | undefined)[],
  count: number,
  optionCount: number,
  letters: readonly string[],
) => {
  const allowed = letters.slice(0, optionCount);
  const missing: number[] = [];
  for (let index = 0; index < count; index++) {
    const answer = answers[index];
    if (!answer || !allowed.includes(answer)) missing.push(index + 1);
  }
  return missing;
};
