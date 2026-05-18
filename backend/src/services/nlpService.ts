import Groq from 'groq-sdk';
import { ChatRequest, ChatResponse, ActionStep, AppError } from '../types/index';
import { MENU_ITEMS } from '../data/menu';
import { logger } from '../lib/logger';
import { applyMatcherRescue, RawStep } from './matchRescue';

let groqClient: Groq | null = null;

const getGroqClient = (): Groq => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new AppError('GROQ_ERROR', 500, 'GROQ_API_KEY environment variable is not set');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

const menuContext = MENU_ITEMS.map((m) => `${m.id}: ${m.name} ($${m.price})`).join('\n');

const SYSTEM_PROMPT = `You are a restaurant ordering assistant.
Parse the user's message and reply with ONLY a JSON object (no prose, no markdown).

The JSON object must have this exact shape:
{
  "steps": [ { "action", "item", "quantity", "userPhrase" }, ... ],
  "response": string
}

Available menu items (the "item" field must be one of these IDs):
${menuContext}

Intent rules (CRITICAL — read first):
- The user must EXPLICITLY ask to add/remove/update an item before you emit a cart action. Imperative verbs ("add", "get me", "I want", "give me", "put", "remove", "delete", "change", "update", "set", "make it") signal a cart action.
- Questions, info requests, descriptions, and chatter NEVER cause a cart change — even when they mention a menu item by name. Use action="none" for ALL of these.
  * Anything starting with "what", "what's", "what is", "tell me", "describe", "how much", "how many", "is the", "are the", "does the", "do you have", "can I", "is there", "what's in", "what comes with" → action="none".
  * Plain item names with no verb (e.g. "wings?", "the calamari") → ambiguous; prefer action="none" and ask the user to clarify in "response".
- When action="none", "response" should answer the user's question or acknowledge the chatter helpfully. Do NOT add the item the user asked about.

Multi-item rules:
- For cart-action turns: emit ONE step per distinct item the user EXPLICITLY asked to add/remove/update. Items may be separated by "and", commas, "plus", or just spaces — handle all naturally.
- Each step's "userPhrase" is the substring that names that item (e.g. for "add 2 lemonades, 1 truffle" → step1.userPhrase="lemonades", step2.userPhrase="truffle").
- For question/chatter turns: emit exactly ONE step with action="none", item=null, quantity=null, userPhrase="".

Examples:
- User: "add 2 lemonades and 1 truffle"           → 2 add steps
- User: "add 2 lemonades, 1 truffle fries"         → 2 add steps
- User: "add wings, fries, and a coke"             → 3 add steps
- User: "a wings and sparkling water plus a calamari" → 3 add steps
- User: "remove the lemonade and add fries"        → 2 steps, mixed verbs
- User: "two wings please"                         → 1 step (item: spicy-buffalo-wings, qty 2, userPhrase: "wings")
- User: "what is in the loaded potato skins"       → 1 step action="none"; response describes the item; NO add
- User: "how much are the wings"                   → 1 step action="none"; response gives the price; NO add
- User: "do you have any vegan options"            → 1 step action="none"; response answers; NO add
- User: "tell me about the truffle fries"          → 1 step action="none"; describe the item; NO add
- User: "thanks"                                   → 1 step action="none", userPhrase=""

Matching rules per step:
- Pick the menu item whose NAME best matches the userPhrase (case-insensitive, ignoring punctuation and connectors like "and"/"&"/"n"/"with"). Never invent IDs.
- If the phrase plausibly fits multiple items (e.g. "lemonade" with both Classic Lemonade and Strawberry Lemonade), pick your best guess — a deterministic disambiguation layer will turn ties into chips. Do not invent qualifiers the user did not say.
- "quantity" is a positive integer when provided; otherwise null.
- If no menu item plausibly matches a phrase, that step uses action="none", item=null, quantity=null and the top-level "response" should mention it (the rescue layer will also handle this).

"response" is the top-level friendly confirmation shown to the user, combining what was applied across all steps. Keep it concise.`;

const STEP_SCHEMA = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['add', 'remove', 'update', 'none'] },
    item: { type: ['string', 'null'] },
    quantity: { type: ['number', 'null'] },
    userPhrase: { type: 'string' },
  },
  required: ['action', 'item', 'quantity', 'userPhrase'],
  additionalProperties: false,
};

export const parseMessage = async (input: ChatRequest): Promise<ChatResponse> => {
  const groq = getGroqClient();
  let completion;
  const startedAt = Date.now();
  logger.info({ event: 'groq.request', model: 'openai/gpt-oss-20b' }, 'groq.request');
  try {
    completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      temperature: 0.1,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'cart_actions',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              steps: { type: 'array', minItems: 1, maxItems: 5, items: STEP_SCHEMA },
              response: { type: 'string' },
            },
            required: ['steps', 'response'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Current cart: ${JSON.stringify(input.cart)}\nMessage: ${input.message}` },
      ],
    });
  } catch (err) {
    logger.error({ err, event: 'groq.error', durationMs: Date.now() - startedAt }, 'groq.error');
    const message = err instanceof Error ? err.message : 'Groq API call failed';
    throw new AppError('GROQ_ERROR', 500, message);
  }
  logger.info({ event: 'groq.response', durationMs: Date.now() - startedAt }, 'groq.response');

  const content = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as { steps: RawStep[]; response: string };

  const knownIds = new Set(MENU_ITEMS.map((m) => m.id));
  const results = parsed.steps.map((s, i) => applyMatcherRescue(s, knownIds, input.message, i));
  const cartSteps: ActionStep[] = results.map((r) => r.step).filter((s) => s.action !== 'none' || s.choices?.length);

  const hasPending = cartSteps.some((s) => s.choices?.length);
  const allNone = results.every((r) => r.matchKind === 'none' && r.step.action === 'none');

  let response: string;
  if (hasPending) {
    const confirmed = results.filter((r) => r.step.action !== 'none' && r.fragment).map((r) => r.fragment);
    const pending = results.filter((r) => r.step.choices?.length).map((r) => r.fragment);
    response = [...confirmed, ...pending].join(' ').trim();
  } else if (allNone) {
    response = parsed.response || "I couldn't find those on the menu.";
  } else {
    response = parsed.response;
  }

  return { steps: cartSteps, response };
};
