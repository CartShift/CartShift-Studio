'use client';

import React, { useState, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Search, Clock, ArrowRight, Sparkles, Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { isRTLLocale, getDateLocaleString } from '@/lib/locale-config';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readingTime?: number;
  translation?: {
    title: string;
    excerpt: string;
    category: string;
  };
}

interface BlogPageContentProps {
  posts: BlogPost[];
  categories: string[];
}

type SortOption = 'newest' | 'oldest' | 'popular';

export const BlogPageContent: React.FC<BlogPageContentProps> = ({ posts, categories }) => {
  const t = useTranslations();
  const locale = useLocale();
  const isHe = isRTLLocale(locale);

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;

  const getCategoryDisplayName = (categoryKey: string): string => {
    if (!isHe) return categoryKey;
    const post = posts.find(p => p.category === categoryKey);
    return post?.translation?.category || categoryKey;
  };

  // Featured posts (latest 3)
  const featuredPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [posts]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        const title = isHe && post.translation?.title ? post.translation.title : post.title;
        const excerpt = isHe && post.translation?.excerpt ? post.translation.excerpt : post.excerpt;
        return title.toLowerCase().includes(query) || excerpt.toLowerCase().includes(query);
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'popular':
          // For now, sort by newest as placeholder for popularity
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [posts, selectedCategory, searchQuery, sortBy, isHe]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredAndSortedPosts.slice(startIndex, startIndex + postsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative bg-surface-50 dark:bg-surface-900">
      <div className="max-w-7xl mx-auto relative z-dropdown">
        {/* Featured Posts Section */}
        {!searchQuery && !selectedCategory && currentPage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-6 h-6 text-accent-600 dark:text-primary-400" />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-surface-900 dark:text-white">
                {t('blog.content.featuredPosts')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => {
                const title = isHe && post.translation?.title ? post.translation.title : post.title;
                const category =
                  isHe && post.translation?.category ? post.translation.category : post.category;
                const formattedDate = new Date(post.date).toLocaleDateString(
                  getDateLocaleString(locale),
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }
                );

                return (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <Card hover glow="subtle" className="h-full group overflow-hidden">
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <span className="text-xs font-semibold text-accent-600 dark:text-primary-400 uppercase tracking-wider">
                              {category}
                            </span>
                          </div>
                          <h3 className="text-xl font-display font-bold text-surface-900 dark:text-white mb-3 group-hover:text-accent-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                            {title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formattedDate}
                            </span>
                            {post.readingTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {post.readingTime} {t('blog.content.readingTime')}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Search and Filters Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 space-y-6"
            >
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  placeholder={t('blog.content.searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full ps-12 pe-4 py-3 rounded-xl glass-effect border border-surface-200 dark:border-surface-700 focus:outline-none focus:ring-2 focus:ring-accent-500 dark:focus:ring-primary-500 text-surface-900 dark:text-white placeholder:text-surface-400"
                />
              </div>

              {/* Category Filters */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2.5 min-h-[40px] rounded-full text-sm font-medium transition-all touch-manipulation active:scale-95 ${
                      selectedCategory === null
                        ? 'bg-accent-600 dark:bg-accent-500 text-white shadow-md'
                        : 'glass-effect text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'
                    }`}
                  >
                    {t('blog.content.allCategories')}
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2.5 min-h-[40px] rounded-full text-sm font-medium transition-all touch-manipulation active:scale-95 ${
                        selectedCategory === category
                          ? 'bg-accent-600 dark:bg-accent-500 text-white shadow-md'
                          : 'glass-effect text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`}
                    >
                      {getCategoryDisplayName(category)}
                    </button>
                  ))}
                </div>
              )}

              {/* Sort and Results Count */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-600 dark:text-surface-400">
                  {filteredAndSortedPosts.length}{' '}
                  {filteredAndSortedPosts.length === 1
                    ? t('blog.content.articles_singular')
                    : t('blog.content.articles')}
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 rounded-lg glass-effect border border-surface-200 dark:border-surface-700 text-sm font-medium text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="newest">{t('blog.content.sort.newest')}</option>
                  <option value="oldest">{t('blog.content.sort.oldest')}</option>
                  <option value="popular">{t('blog.content.sort.popular')}</option>
                </select>
              </div>
            </motion.div>

            {/* Posts Grid */}
            {paginatedPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-surface-600 dark:text-surface-300">
                  {t('blog.noPosts')}
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {paginatedPosts.map((post, index) => {
                    const title =
                      isHe && post.translation?.title ? post.translation.title : post.title;
                    const category =
                      isHe && post.translation?.category
                        ? post.translation.category
                        : post.category;
                    const excerpt =
                      isHe && post.translation?.excerpt ? post.translation.excerpt : post.excerpt;
                    const formattedDate = new Date(post.date).toLocaleDateString(
                      getDateLocaleString(locale),
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    );

                    return (
                      <motion.div
                        key={post.slug}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      >
                        <Link href={`/blog/${post.slug}`}>
                          <Card hover glow="glow" className="h-full group overflow-hidden">
                            <CardContent className="p-4">
                              <div className="mb-3">
                                <span className="px-3 py-1 bg-accent-600/10 dark:bg-primary-600/20 text-accent-700 dark:text-primary-300 text-xs font-bold rounded-full">
                                  {category}
                                </span>
                              </div>
                              <h3 className="text-lg font-display font-bold text-surface-900 dark:text-white mb-2 group-hover:text-accent-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                                {title}
                              </h3>
                              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4 line-clamp-2">
                                {excerpt}
                              </p>
                              {/* Meta info */}
                              <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
                                <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formattedDate}
                                  </span>
                                  {post.readingTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {post.readingTime} {t('blog.content.readingTime')}
                                    </span>
                                  )}
                                </div>
                                <ArrowRight
                                  className={`w-5 h-5 text-accent-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform ${isHe ? 'rotate-180 group-hover:-translate-x-1' : ''}`}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg glass-effect text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation active:scale-95"
                    >
                      {t('blog.content.pagination.previous')}
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg text-sm font-medium transition-all touch-manipulation active:scale-95 ${
                          currentPage === page
                            ? 'bg-accent-600 dark:bg-accent-500 text-white shadow-md'
                            : 'glass-effect text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg glass-effect text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation active:scale-95"
                    >
                      {t('blog.content.pagination.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 mt-12 lg:mt-0">
            <div className="sticky top-24 space-y-8">
              {/* Newsletter Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="relative overflow-hidden !p-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 to-primary-500/10" />
                  <CardContent className="relative p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-accent-600 dark:text-primary-400" />
                      <h3 className="text-lg font-display font-bold text-surface-900 dark:text-white">
                        {t('blog.content.newsletter.title')}
                      </h3>
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-300 mb-4">
                      {t('blog.content.newsletter.description')}
                    </p>
                    <form className="space-y-3">
                      <input
                        type="email"
                        placeholder={t('blog.content.newsletter.placeholder')}
                        className="w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
                      />
                      <button
                        type="submit"
                        className="w-full px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-600 text-white font-medium transition-colors"
                      >
                        {t('blog.content.newsletter.subscribe')}
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('blog.content.newsletter.categories')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {categories.map(category => {
                          const count = posts.filter(p => p.category === category).length;
                          return (
                            <button
                              key={category}
                              onClick={() =>
                                setSelectedCategory(category === selectedCategory ? null : category)
                              }
                              className={`w-full text-start px-4 py-2 rounded-lg transition-all ${
                                selectedCategory === category
                                  ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300'
                                  : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200'
                              }`}
                            >
                              <span className="font-medium">
                                {getCategoryDisplayName(category)}
                              </span>
                              <span className="float-end text-sm text-surface-500 dark:text-surface-400">
                                ({count})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
