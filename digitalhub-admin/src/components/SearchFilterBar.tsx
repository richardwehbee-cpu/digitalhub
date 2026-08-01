import React from "react";

export type SortOption =
  | "name_asc"
  | "name_desc"
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "stock_asc"
  | "stock_desc";

export interface FilterConfig {
  label: string;
  key: string;
  options: { label: string; value: string }[];
}

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  sortOptions: { label: string; value: SortOption }[];
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  totalResults: number;
  placeholder?: string;
}

export default function SearchFilterBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  sortOptions,
  filters = [],
  filterValues = {},
  onFilterChange,
  totalResults,
  placeholder = "Search...",
}: SearchFilterBarProps) {
  const inputStyle: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: "13px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#fff",
    color: "#111",
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        alignItems: "center",
        marginBottom: "16px",
        padding: "12px 16px",
        background: "#f9f9f9",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
      }}
    >
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, minWidth: "220px", flex: "1 1 220px" }}
      />

      {/* Dynamic Filters */}
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filterValues[filter.key] ?? ""}
          onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
          style={{ ...inputStyle, minWidth: "140px" }}
        >
          <option value="">{filter.label}: All</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        style={{ ...inputStyle, minWidth: "150px" }}
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Result count */}
      <span
        style={{
          fontSize: "12px",
          color: "#888",
          marginLeft: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {totalResults} result{totalResults !== 1 ? "s" : ""}
      </span>

      {/* Clear */}
      {(search ||
        Object.values(filterValues).some(Boolean) ||
        sort !== sortOptions[0]?.value) && (
        <button
          onClick={() => {
            onSearchChange("");
            onSortChange(sortOptions[0]?.value ?? "name_asc");
            filters.forEach((f) => onFilterChange?.(f.key, ""));
          }}
          style={{
            padding: "7px 12px",
            fontSize: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#fff",
            cursor: "pointer",
            color: "#666",
            whiteSpace: "nowrap",
          }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}