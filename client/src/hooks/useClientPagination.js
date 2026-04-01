import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PAGE_SIZE,
  normalizePageSize
} from "../shared/constants/pagination";

export default function useClientPagination(items = [], initialLimit = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [limitState, setLimitState] = useState(normalizePageSize(initialLimit));

  const totalCount = Array.isArray(items) ? items.length : 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / limitState));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    setPage((previousPage) => Math.min(previousPage, pageCount));
  }, [pageCount]);

  const pagedItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const startIndex = (currentPage - 1) * limitState;
    return safeItems.slice(startIndex, startIndex + limitState);
  }, [currentPage, items, limitState]);

  const setLimit = (nextLimit) => {
    setLimitState(normalizePageSize(nextLimit));
    setPage(1);
  };

  return {
    currentPage,
    limit: limitState,
    page: currentPage,
    pageCount,
    pagedItems,
    setLimit,
    setPage,
    totalCount
  };
}
