import { ActionStep, ChatChoice, PendingAction } from '../types/index';
import { MENU_ITEMS } from '../data/menu';
import { logger } from '../lib/logger';
import { resolveMenuItem, detectSiblingAmbiguity } from './menuMatcher';

export interface RawStep {
  action: ActionStep['action'];
  item: string | null;
  quantity: number | null;
  userPhrase: string;
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

export const verbResponse = (action: ActionStep['action'], name: string, quantity?: number): string => {
  if (action === 'remove') return `Removed ${name} from your cart.`;
  if (action === 'update') return `Updated ${name}${quantity ? ` to ${quantity}` : ''}.`;
  if (quantity && quantity > 1) return `Added ${quantity} ${name} to your cart.`;
  return `Added ${name} to your cart.`;
};

const joinNames = (names: string[]): string =>
  names.length === 2
    ? `${names[0]} or ${names[1]}`
    : `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;

export interface RescueResult {
  step: ActionStep;
  fragment: string;
  matchKind: 'match' | 'ambiguous' | 'none';
}

export const applyMatcherRescue = (
  raw: RawStep,
  knownIds: Set<string>,
  fullUserMessage: string,
  stepIndex: number,
): RescueResult => {
  let action = raw.action;
  let item = raw.item;
  let quantity = raw.quantity;
  let choices: ChatChoice[] | undefined;
  let pendingAction: PendingAction | undefined;

  const groqItemKnown = item !== null && knownIds.has(item);
  const match = resolveMenuItem(raw.userPhrase);
  const top = match.candidates[0] ?? null;
  const runner = match.candidates[1] ?? null;
  const groqInCandidates = groqItemKnown && match.candidates.some((c) => c.id === item);
  const ambiguityOverridesGroq = match.kind === 'ambiguous' && (groqInCandidates || !groqItemKnown);
  const siblingChoices =
    groqItemKnown && action !== 'none' && match.kind !== 'ambiguous'
      ? detectSiblingAmbiguity(item!, raw.userPhrase)
      : null;
  const needsRescue =
    (action !== 'none' && !groqItemKnown) ||
    (action === 'none' && item === null) ||
    ambiguityOverridesGroq ||
    siblingChoices !== null;

  let fragment: string;

  if (needsRescue) {
    logger.info(
      {
        event: 'match.fallback',
        stepIndex,
        userMessage: raw.userPhrase,
        fullUserMessage,
        groqItem: raw.item,
        groqAction: raw.action,
        matchKind: match.kind,
        resolvedItem: match.kind === 'match' ? match.id : null,
        topCandidates: match.candidates.map((c) => ({ id: c.id, score: round4(c.score) })),
        topScore: top ? round4(top.score) : null,
        marginRatio: top && runner ? round4(runner.score / top.score) : null,
        overrodeGroq: ambiguityOverridesGroq || siblingChoices !== null,
        siblingAmbiguity: siblingChoices !== null,
      },
      'match.fallback'
    );

    if (siblingChoices !== null) {
      const names = siblingChoices.map((c) => c.name);
      const pendingVerb: PendingAction['action'] =
        action === 'remove' || action === 'update' ? action : 'add';
      pendingAction = { action: pendingVerb };
      if (quantity !== null) pendingAction.quantity = quantity;
      choices = siblingChoices;
      action = 'none';
      item = null;
      quantity = null;
      fragment = `For "${raw.userPhrase || 'that'}", did you mean ${joinNames(names)}?`;
    } else if (match.kind === 'ambiguous') {
      const top3 = match.candidates.slice(0, 3);
      const names = top3.map((c) => c.name);
      const pendingVerb: PendingAction['action'] =
        action === 'remove' || action === 'update' ? action : 'add';
      pendingAction = { action: pendingVerb };
      if (quantity !== null) pendingAction.quantity = quantity;
      choices = top3.map((c) => ({ id: c.id, name: c.name }));
      action = 'none';
      item = null;
      quantity = null;
      fragment = `For "${raw.userPhrase || 'that'}", did you mean ${joinNames(names)}?`;
    } else if (match.kind === 'match') {
      const found = MENU_ITEMS.find((m) => m.id === match.id)!;
      if (action === 'none') action = 'add';
      item = found.id;
      fragment = verbResponse(action, found.name, quantity ?? undefined);
    } else {
      action = 'none';
      item = null;
      quantity = null;
      fragment = raw.userPhrase ? `I couldn't find "${raw.userPhrase}" on the menu.` : '';
    }
  } else if (groqItemKnown && action !== 'none') {
    const found = MENU_ITEMS.find((m) => m.id === item)!;
    fragment = verbResponse(action, found.name, quantity ?? undefined);
  } else {
    fragment = '';
  }

  const step: ActionStep = { action };
  if (item !== null && action !== 'none') step.item = item;
  if (quantity !== null && action !== 'none') step.quantity = quantity;
  if (choices && choices.length && pendingAction) {
    step.choices = choices;
    step.pendingAction = pendingAction;
  }
  return { step, fragment, matchKind: match.kind };
};
