const MAX_AGE = 30 * 60 * 1000;
export const testDraftKey = (id: number, userId?: number) => `test-draft:${id}:${userId ?? 'guest'}`;

export const readTestDraft = (key: string): Record<number, number> => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    const age = Date.now() - saved?.at;
    if (!Number.isFinite(age) || age < 0 || age >= MAX_AGE || !saved?.answers || Array.isArray(saved.answers) || typeof saved.answers !== 'object') return {};
    return Object.fromEntries(Object.entries(saved.answers).filter(([questionId, optionId]) =>
      Number.isSafeInteger(Number(questionId)) && Number(questionId) > 0 && typeof optionId === 'number' && Number.isSafeInteger(optionId) && optionId > 0,
    )) as Record<number, number>;
  } catch {
    return {};
  }
};
