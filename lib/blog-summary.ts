import type { BlogPost } from '@/lib/markdown';

/** Only the fields the blog index needs may cross the server/client boundary. */
export type BlogPostSummary = Pick<
  BlogPost,
  'slug' | 'title' | 'excerpt' | 'date' | 'category' | 'image' | 'imageAlt' | 'readingTime'
> & {
  translation?: Pick<NonNullable<BlogPost['translation']>, 'title' | 'excerpt' | 'category'>;
  translations?: {
    de?: Pick<NonNullable<NonNullable<BlogPost['translations']>['de']>, 'title' | 'excerpt' | 'category'>;
  };
};

export function toBlogPostSummary(post: BlogPost): BlogPostSummary {
  const { slug, title, excerpt, date, category, image, imageAlt, readingTime } = post;
  return {
    slug, title, excerpt, date, category, image, imageAlt, readingTime,
    ...(post.translation && {
      translation: {
        title: post.translation.title,
        excerpt: post.translation.excerpt,
        category: post.translation.category,
      },
    }),
    ...(post.translations?.de && {
      translations: {
        de: {
          title: post.translations.de.title,
          excerpt: post.translations.de.excerpt,
          category: post.translations.de.category,
        },
      },
    }),
  };
}
