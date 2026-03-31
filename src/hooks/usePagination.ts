import { useState, useMemo } from 'react';

const PAGE_SIZE = 10;

export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  // Reset to page 1 when items change significantly
  const setPageSafe = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return { paged, page: safePage, setPage: setPageSafe, totalPages, totalItems: items.length, pageSize: PAGE_SIZE };
}
