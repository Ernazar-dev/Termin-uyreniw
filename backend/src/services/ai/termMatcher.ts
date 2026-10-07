import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { normalizeText } from '../../utils/text';
import type { MatchedTerm } from './ai.types';

const MIN_CANDIDATE_LENGTH = 3;

/**
 * Common Karakalpak question phrases removed to isolate the term itself.
 * `\b` is ASCII-only in JS, so word boundaries are expressed with whitespace lookarounds.
 */
const QUESTION_PHRASES = [
  'degenimiz ne',
  'degen (?:sóz|termin|ne)',
  'ne degen',
  'neni ańlatadı',
  'mánisi (?:qanday|ne)',
  'haqqında (?:aytıp|maǵlıwmat) ber(?:iń)?',
  'túsindirip ber(?:iń)?',
  'túsindir(?:iń)?',
  'degen(?:imiz)?',
  'ne',
  'sóziniń',
  'termini(?:niń)?',
];

const QUESTION_PATTERNS = QUESTION_PHRASES.map((phrase) => new RegExp(`(?<=^|\\s)${phrase}(?=\\s|$)`, 'gu'));

const termSelect = {
  id: true,
  name: true,
  definition: true,
  example: true,
  image: true,
  chapter: { select: { id: true, title: true, class: { select: { id: true, name: true } } } },
} satisfies Prisma.TermSelect;

export const extractCandidate = (question: string) => {
  let candidate = normalizeText(question).replace(/[?!.,:;«»"“”()]/g, ' ');
  for (const pattern of QUESTION_PATTERNS) candidate = candidate.replace(pattern, ' ');
  return candidate.replace(/\s+/g, ' ').trim();
};

const findByExactName = (candidate: string) =>
  prisma.term.findFirst({
    where: { name: { equals: candidate, mode: Prisma.QueryMode.insensitive } },
    select: termSelect,
  });

/** Finds the longest platform term whose name appears inside the question. */
const findContainedInQuestion = async (question: string) => {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Term"
    WHERE length(name) >= ${MIN_CANDIDATE_LENGTH}
      AND strpos(lower(${question}), lower(name)) > 0
    ORDER BY length(name) DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return prisma.term.findUnique({ where: { id: rows[0].id }, select: termSelect });
};

const findByPartialName = (candidate: string) =>
  prisma.term.findFirst({
    where: { name: { startsWith: candidate, mode: Prisma.QueryMode.insensitive } },
    orderBy: { name: 'asc' },
    select: termSelect,
  });

export const findTermInQuestion = async (question: string): Promise<MatchedTerm | null> => {
  const candidate = extractCandidate(question);

  if (candidate.length >= MIN_CANDIDATE_LENGTH) {
    const exact = await findByExactName(candidate);
    if (exact) return exact;
  }

  const contained = await findContainedInQuestion(normalizeText(question));
  if (contained) return contained;

  if (candidate.length >= MIN_CANDIDATE_LENGTH && !candidate.includes(' ')) {
    return findByPartialName(candidate);
  }

  return null;
};
