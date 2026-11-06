export type Language = 'am' | 'en';

// The lookahead keeps this to letters, so Ethiopic punctuation and numerals don't count.
const ETHIOPIC_LETTERS = /(?=\p{L})\p{Script=Ethiopic}/gu;
const LATIN_LETTERS = /(?=\p{L})\p{Script=Latin}/gu;

const countMatches = (text: string, pattern: RegExp): number =>
  (text.match(pattern) || []).length;

export const detectLanguage = (text: string): Language => {
  const ethiopic = countMatches(text, ETHIOPIC_LETTERS);
  const latin = countMatches(text, LATIN_LETTERS);
  return ethiopic > 0 && ethiopic >= latin ? 'am' : 'en';
};

// `requested` comes straight from request bodies, so it can be anything (e.g. 'auto').
export const resolveLanguage = (requested: unknown, text: string): Language =>
  requested === 'am' || requested === 'en' ? requested : detectLanguage(text);
