import { describe, expect, it } from 'vitest';
import { mentionAtCursor } from '@/lib/utils/mentions';

describe('mention token at cursor', () => {
  it('recognizes a mention at the beginning or after whitespace', () => {
    expect(mentionAtCursor('@Daniel', 7)).toEqual({ start: 0, query: 'Daniel' });
    expect(mentionAtCursor('Hello @Daniel Smith', 19)).toEqual({ start: 6, query: 'Daniel Smith' });
  });

  it('never suggests users inside an email address or identifier', () => {
    expect(mentionAtCursor('contact me@example.com', 22)).toBeNull();
    expect(mentionAtCursor('prefix@name', 11)).toBeNull();
  });

  it('stops at a new line and rejects invalid cursor positions', () => {
    expect(mentionAtCursor('hello @Dan\nnext', 15)).toBeNull();
    expect(mentionAtCursor('@Dan', -1)).toBeNull();
  });
});
