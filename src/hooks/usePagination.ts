/**
 * 分页 Hook - 处理列表分页逻辑
 * @param items - 要分页的完整列表
 * @param pageSize - 每页大小，默认 20
 */
import { useState, useMemo, useCallback } from 'react';

export const usePagination = <T,>(items: T[], pageSize: number = 20) => {
  const [page, setPage] = useState(1);
  
  const displayedCount = Math.min(items.length, page * pageSize);
  
  const displayedItems = useMemo(
    () => items.slice(0, displayedCount),
    [items, displayedCount]
  );
  
  const hasMore = items.length > displayedCount;
  
  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage(p => p + 1);
    }
  }, [hasMore]);
  
  const reset = useCallback(() => {
    setPage(1);
  }, []);
  
  return {
    displayedItems,
    hasMore,
    loadMore,
    reset,
    page,
    totalCount: items.length,
    displayedCount,
  };
};
