import { MENU_ITEMS } from '../data/menu';

export interface RankedCandidate { id: string; name: string; score: number }

export type MatchResult =
  | { kind: 'match'; id: string; candidates: RankedCandidate[] }
  | { kind: 'ambiguous'; candidates: RankedCandidate[] }
  | { kind: 'none'; candidates: RankedCandidate[] };

export const MIN_SCORE = 0.55;
export const MARGIN_RATIO = 0.85;

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'some', 'please', 'pls', 'i', 'id', 'would', 'like', 'want', 'need',
  'get', 'me', 'order', 'add', 'remove', 'delete', 'drop', 'cancel', 'update', 'change',
  'set', 'make', 'it', 'to', 'of', 'for', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten',
]);

export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bn\b/g, ' and ')
    .replace(/\bwith\b/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripAnd = (s: string): string => s.replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();

export const contentTokens = (s: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of normalize(s).split(' ')) {
    if (!t || STOPWORDS.has(t) || /^\d+$/.test(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
};

const nameTokens = (name: string): string[] => stripAnd(normalize(name)).split(' ').filter(Boolean);

interface MenuIndex { df: Map<string, number>; total: number }

const buildIndex = (): MenuIndex => {
  const df = new Map<string, number>();
  for (const item of MENU_ITEMS) {
    const unique = new Set(nameTokens(item.name));
    for (const t of unique) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return { df, total: MENU_ITEMS.length };
};

const INDEX: MenuIndex = buildIndex();

const idf = (token: string): number => {
  const d = INDEX.df.get(token);
  if (!d) return 0;
  return Math.log(1 + INDEX.total / d);
};

const scoreItem = (userTokens: string[], item: { name: string }): number => {
  const nTokens = nameTokens(item.name);
  const nSet = new Set(nTokens);
  const uSet = new Set(userTokens);

  let inter = 0;
  let denom = 0;
  for (const t of userTokens) {
    const w = idf(t);
    denom += w;
    if (nSet.has(t)) inter += w;
  }
  if (denom === 0) return 0;

  const allPresent = userTokens.every((t) => nSet.has(t)) ? 1 : 0;
  const coverage = inter / denom;

  const userJoined = userTokens.join(' ');
  const nameJoined = nTokens.join(' ');
  const contiguousBonus = nameJoined.includes(userJoined) ? 0.15 : 0;

  const sameSet = uSet.size === nSet.size && [...uSet].every((t) => nSet.has(t));
  const exactNameBonus = sameSet ? 0.25 : 0;

  const lengthPenalty = Math.min(0.20, 0.05 * Math.max(0, nTokens.length - userTokens.length));

  return coverage * allPresent + contiguousBonus + exactNameBonus - lengthPenalty;
};

export const rankMenuItems = (userMessage: string): RankedCandidate[] => {
  const userTokens = contentTokens(userMessage);
  if (userTokens.length === 0) return [];
  const ranked = MENU_ITEMS
    .map((m) => ({ id: m.id, name: m.name, score: scoreItem(userTokens, m) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, 3);
};

export const findSiblingsByName = (itemId: string): { id: string; name: string }[] => {
  const target = MENU_ITEMS.find((m) => m.id === itemId);
  if (!target) return [];
  const targetTokens = new Set(nameTokens(target.name));
  return MENU_ITEMS.filter((m) => {
    if (m.id === itemId) return false;
    return nameTokens(m.name).some((t) => targetTokens.has(t));
  }).map((m) => ({ id: m.id, name: m.name }));
};

export const detectSiblingAmbiguity = (
  itemId: string,
  userPhrase: string,
): { id: string; name: string }[] | null => {
  const target = MENU_ITEMS.find((m) => m.id === itemId);
  if (!target) return null;
  const siblings = findSiblingsByName(itemId);
  if (siblings.length === 0) return null;

  const targetTokens = new Set(nameTokens(target.name));
  const overlapping = siblings.filter((s) => {
    const sTokens = nameTokens(s.name);
    return sTokens.some((t) => targetTokens.has(t));
  });
  if (overlapping.length === 0) return null;

  const sharedTokens = new Set<string>();
  for (const s of overlapping) {
    for (const t of nameTokens(s.name)) if (targetTokens.has(t)) sharedTokens.add(t);
  }

  const discriminators = new Set<string>();
  for (const t of nameTokens(target.name)) if (!sharedTokens.has(t)) discriminators.add(t);
  for (const s of overlapping) {
    for (const t of nameTokens(s.name)) if (!sharedTokens.has(t)) discriminators.add(t);
  }
  if (discriminators.size === 0) return null;

  const userTokens = contentTokens(userPhrase);
  const hasDiscriminator = userTokens.some((t) => discriminators.has(t));
  if (hasDiscriminator) return null;

  return [
    { id: target.id, name: target.name },
    ...overlapping.slice(0, 2),
  ];
};

export const resolveMenuItem = (userMessage: string): MatchResult => {
  const candidates = rankMenuItems(userMessage);
  if (candidates.length === 0 || candidates[0].score < MIN_SCORE) {
    return { kind: 'none', candidates };
  }
  const top = candidates[0];
  const runner = candidates[1];
  if (runner && runner.score / top.score >= MARGIN_RATIO) {
    return { kind: 'ambiguous', candidates };
  }
  return { kind: 'match', id: top.id, candidates };
};
