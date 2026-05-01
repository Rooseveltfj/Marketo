import { useState, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getProducts } from '@/services/firebase/products.service';
import { ProductFilters } from '@/types/product.types';
import { useDebounce } from './useDebounce';
import { useUIStore } from '@/stores/uiStore';

export function useSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const [filters, setFilters] = useState<ProductFilters>({ sortBy: 'recent' });
  const { addToHistory, searchHistory, removeFromHistory, clearHistory } = useUIStore();

  const activeFiltersCount = useMemo(() => Object.keys(filters).filter(k => 
    k !== 'sortBy' && k !== 'page' && k !== 'limit' && k !== 'query' && filters[k as keyof ProductFilters] !== undefined
  ).length, [filters]);

  const queryFilters: ProductFilters = useMemo(() => ({
    ...filters,
    query: debouncedQuery,
  }), [filters, debouncedQuery]);

  const shouldFetch = debouncedQuery.trim().length > 0 || activeFiltersCount > 0;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['searchProducts', queryFilters],
    queryFn: ({ pageParam }) => getProducts(queryFilters, pageParam),
    initialPageParam: undefined as any,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    enabled: shouldFetch,
  });

  const results = useMemo(() => data ? data.pages.flatMap(p => p.data) : [], [data?.pages]);

  const updateFilter = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ sortBy: 'recent' });
  }, []);

  const submitSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim().length > 0) {
      addToHistory(searchQuery);
    }
  }, [addToHistory]);

  return {
    query,
    setQuery,
    debouncedQuery,
    filters,
    results,
    isLoading: isLoading && shouldFetch,
    isFetchingNextPage,
    updateFilter,
    clearFilters,
    submitSearch,
    fetchNextPage,
    hasNextPage,
    activeFiltersCount,
    searchHistory,
    removeFromHistory,
    clearHistory
  };
}
