/** Returns the editable @mention token immediately preceding the cursor.
 * Emails and embedded @ signs are not mentions; display names may have spaces.
 */
export function mentionAtCursor(text: string, cursor: number): { start: number; query: string } | null {
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > text.length) return null;
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf('@');
  if (at === -1) return null;
  if (at > 0 && !/[\s([{]/u.test(before[at - 1])) return null;
  const query = before.slice(at + 1);
  if (query.includes('\n') || query.includes('\r') || query.length > 64) return null;
  return { start: at, query };
}
