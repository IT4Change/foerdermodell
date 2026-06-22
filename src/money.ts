/**
 * Money is handled as integer cents throughout to avoid floating-point drift.
 * The domain deals in whole euros for shares, but balances carry cents
 * (the source documents show e.g. a balance of 4.605,56 €).
 */
export type Cents = number;

/** Build cents from a euro value (e.g. 4605.56 -> 460556). */
export function euros(value: number): Cents {
  return Math.round(value * 100);
}

/** Format cents as a German euro string, e.g. 460556 -> "4.605,56 €". */
export function fmt(c: Cents): string {
  const sign = c < 0 ? "-" : "";
  const abs = Math.abs(c);
  const whole = Math.floor(abs / 100).toLocaleString("de-DE");
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole},${frac} €`;
}
