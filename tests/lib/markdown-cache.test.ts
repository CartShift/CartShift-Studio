import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllPosts, getPostBySlug, getPostSlugs } from '@/lib/markdown';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('static Markdown processing', () => {
  it('reuses parsed posts and the sorted post list in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const slug = getPostSlugs()[0];
    expect(slug).toBeTruthy();

    const [first, second] = await Promise.all([getPostBySlug(slug), getPostBySlug(slug)]);
    expect(first).not.toBeNull();
    expect(first).toBe(second);

    const [allFirst, allSecond] = await Promise.all([getAllPosts(), getAllPosts()]);
    expect(allFirst).toBe(allSecond);
    expect(allFirst.some(post => post.slug === slug)).toBe(true);
  });

  it('re-reads source Markdown in development so editing stays responsive', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const slug = getPostSlugs()[0];
    const first = await getPostBySlug(slug);
    const second = await getPostBySlug(slug);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first).not.toBe(second);
    expect(first?.content).toBe(second?.content);
  });

  it('does not change the missing post contract', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(await getPostBySlug('this-post-does-not-exist')).toBeNull();
  });
});
