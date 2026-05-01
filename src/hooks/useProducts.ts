import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getProducts } from '@/services/firebase/products.service';
import { ProductFilters } from '@/types/product.types';

export function useProducts(filters: ProductFilters) {
  const queryInfo = useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam }) => getProducts(filters, pageParam),
    initialPageParam: undefined as any,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.lastDoc;
      }
      return undefined;
    },
  });

  const data = useMemo(() => {
    return queryInfo.data?.pages.flatMap((page) => page.data) || [];
  }, [queryInfo.data?.pages]);

  return {
    ...queryInfo,
    data,
  };
}
