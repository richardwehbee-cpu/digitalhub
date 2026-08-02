import { useMemo } from "react";
import type { SortOption } from "../components/SearchFilterBar";

interface UseFilteredDataOptions<T> {
  data: T[];
  search: string;
  searchFields: (keyof T)[];
  sort: SortOption;
  sortFieldMap?: Partial<Record<SortOption, keyof T>>;
  filters: Record<string, string>;
  filterFieldMap?: Record<string, keyof T>;
  page: number;
  pageSize: number;
}

export interface FilteredResult<T> {
  paginated: T[];
  filtered: T[];
  total: number;
  totalPages: number;
}

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).toLowerCase();
}

function safeNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export function useFilteredData<T extends { id: number | string }>({
  data,
  search,
  searchFields,
  sort,
  sortFieldMap = {},
  filters,
  filterFieldMap = {},
  page,
  pageSize,
}: UseFilteredDataOptions<T>): FilteredResult<T> {
  return useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => safeStr(item[field]).includes(q))
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const field = filterFieldMap[key];
      if (!field) return;
      result = result.filter((item) =>
        safeStr(item[field]).includes(value.toLowerCase())
      );
    });

    // Sort
    switch (sort) {
      case "name_asc": {
        const field = sortFieldMap["name_asc"] ?? ("name" as keyof T);
        result.sort((a, b) =>
          safeStr(a[field]).localeCompare(safeStr(b[field]))
        );
        break;
      }
      case "name_desc": {
        const field = sortFieldMap["name_desc"] ?? ("name" as keyof T);
        result.sort((a, b) =>
          safeStr(b[field]).localeCompare(safeStr(a[field]))
        );
        break;
      }
      case "price_asc": {
        const field = sortFieldMap["price_asc"] ?? ("price" as keyof T);
        result.sort((a, b) => safeNum(a[field]) - safeNum(b[field]));
        break;
      }
      case "price_desc": {
        const field = sortFieldMap["price_desc"] ?? ("price" as keyof T);
        result.sort((a, b) => safeNum(b[field]) - safeNum(a[field]));
        break;
      }
      case "stock_asc": {
        const field = sortFieldMap["stock_asc"] ?? ("stock" as keyof T);
        result.sort((a, b) => safeNum(a[field]) - safeNum(b[field]));
        break;
      }
      case "stock_desc": {
        const field = sortFieldMap["stock_desc"] ?? ("stock" as keyof T);
        result.sort((a, b) => safeNum(b[field]) - safeNum(a[field]));
        break;
      }
      case "oldest":
        result.sort((a, b) =>
          String(a.id).localeCompare(String(b.id))
        );
        break;
      case "newest":
      default:
        result.sort((a, b) =>
          String(b.id).localeCompare(String(a.id))
        );
        break;
    }

    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const paginated = result.slice(start, start + pageSize);

    return { paginated, filtered: result, total, totalPages };
  }, [
    data,
    search,
    searchFields,
    sort,
    sortFieldMap,
    filters,
    filterFieldMap,
    page,
    pageSize,
  ]);
}