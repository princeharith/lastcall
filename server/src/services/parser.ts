export interface ParsedTransaction {
  amount: number;
  merchant: string | null;
  raw: string;
}

/**
 * Extracts a dollar amount from a BofA-style notification string.
 *
 * Handles:
 *   $47.23  →  47.23
 *   $1,234.56  →  1234.56
 *   $50  →  50
 */
function parseAmount(text: string): number | null {
  const match = text.match(/\$[\d,]+\.?\d{0,2}/);
  if (!match) return null;
  const cleaned = match[0].replace(/[$,]/g, '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

/**
 * Extracts the merchant name from a BofA notification.
 *
 * Patterns handled:
 *   "... purchase at The Ainsworth"
 *   "... purchase at The Ainsworth was made ..."
 *   "... purchase at WHOLE FOODS MKT was made on your debit card ..."
 */
function parseMerchant(text: string): string | null {
  // Match text after "at " (case-insensitive), stop at "was made", end of string,
  // "on your", or " ending"
  const match = text.match(/\bat\s+(.+?)(?:\s+was\s+made|\s+on\s+your|\s+ending\b|$)/i);
  if (!match) return null;
  return match[1].trim() || null;
}

/**
 * Parses a BofA push notification body into a structured transaction.
 * Returns null if no dollar amount can be found.
 *
 * @example
 * parse('You made a $47.23 purchase at The Ainsworth')
 * // → { amount: 47.23, merchant: 'The Ainsworth', raw: '...' }
 */
export function parse(text: string): ParsedTransaction | null {
  const amount = parseAmount(text);
  if (amount === null) return null;

  const merchant = parseMerchant(text);
  return { amount, merchant, raw: text };
}