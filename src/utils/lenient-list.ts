/**
 * Lenient list parsing: one item that does not match the schema is left out instead of failing the whole list.
 * The list itself must still be an array; the caller's container schema enforces that.
 */

import type { z } from 'zod';
import { logger } from './logger.js';

/** Counts list items left out of one response. Pass the same tally to every list parsed for that call. */
export interface SkipTally {
  skipped: number;
}

const MAX_LOGGED_FIELDS = 20;

/**
 * Parse each item on its own. Items that fail are counted in `tally` and logged by field path only
 * (for example `calendar_users.role`); their values are never logged or returned.
 */
export function parseListLenient<T>(
  schema: z.ZodType<T>,
  items: unknown[],
  label: string,
  tally?: SkipTally
): T[] {
  const kept: T[] = [];
  const fields = new Set<string>();

  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      kept.push(result.data);
      return;
    }
    for (const issue of result.error.issues) {
      fields.add([label, String(index), ...issue.path.map(String)].join('.'));
    }
  });

  const skipped = items.length - kept.length;
  if (skipped > 0) {
    if (tally) tally.skipped += skipped;
    logger.warn('Skipped list items that did not match the expected shape', {
      label,
      skipped,
      fields: [...fields].slice(0, MAX_LOGGED_FIELDS),
    });
  }

  return kept;
}

/** Fields added to a tool result only when items were left out. Empty when nothing was skipped. */
export function skippedItemsFields(skipped: number): { skipped_items?: number; skipped_items_note?: string } {
  if (skipped === 0) return {};
  return {
    skipped_items: skipped,
    skipped_items_note:
      `${skipped} item(s) returned by TimeTree could not be read and were left out of this result. ` +
      `TimeTree から読めなかった項目を ${skipped} 件除外した。`,
  };
}
