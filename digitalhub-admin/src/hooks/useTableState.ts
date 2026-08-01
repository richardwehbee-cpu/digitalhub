import { useState, useCallback } from "react";
import type { SortOption } from "../components/SearchFilterBar";

export interface TableState {
  search: string;
  sort: SortOption;
  filters: Record<string, string>;
  page: number;
  pageSize: number;
}

export interface UseTableStateReturn {
  state: TableState;
  setSearch: (v: string) => void;
  setSort: (v: SortOption) => void;
  setFilter: (key: string, value: string) => void;
  setPage: (v: number) => void;
  setPageSize: (v: number) => void;
  reset: () => void;
}

const DEFAULT_STATE: TableState = {
  search: "",
  sort: "newest",
  filters: {},
  page: 1,
  pageSize: 10,
};

export function useTableState(
  initial: Partial<TableState> = {}
): UseTableStateReturn {
  const initialState: TableState = { ...DEFAULT_STATE, ...initial };
  const [state, setState] = useState<TableState>(initialState);

  const setSearch = useCallback((v: string) => {
    setState((s) => ({ ...s, search: v, page: 1 }));
  }, []);

  const setSort = useCallback((v: SortOption) => {
    setState((s) => ({ ...s, sort: v, page: 1 }));
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setState((s) => ({
      ...s,
      filters: { ...s.filters, [key]: value },
      page: 1,
    }));
  }, []);

  const setPage = useCallback((v: number) => {
    setState((s) => ({ ...s, page: v }));
  }, []);

  const setPageSize = useCallback((v: number) => {
    setState((s) => ({ ...s, pageSize: v, page: 1 }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    setSearch,
    setSort,
    setFilter,
    setPage,
    setPageSize,
    reset,
  };
}