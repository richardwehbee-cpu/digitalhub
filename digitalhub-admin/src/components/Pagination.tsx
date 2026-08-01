import React from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const btnStyle = (active = false, disabled = false): React.CSSProperties => ({
    padding: "5px 10px",
    fontSize: "13px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: disabled ? "not-allowed" : "pointer",
    background: active ? "#3b82f6" : disabled ? "#f5f5f5" : "#fff",
    color: active ? "#fff" : disabled ? "#bbb" : "#333",
    fontWeight: active ? 700 : 400,
    minWidth: "34px",
    textAlign: "center",
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        marginTop: "16px",
        padding: "12px 16px",
        background: "#f9f9f9",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        fontSize: "13px",
      }}
    >
      {/* Info */}
      <span style={{ color: "#666", whiteSpace: "nowrap" }}>
        {total === 0
          ? "No results"
          : `Showing ${start}–${end} of ${total}`}
      </span>

      {/* Page numbers */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          style={btnStyle(false, page === 1)}
          title="First page"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={btnStyle(false, page === 1)}
          title="Previous page"
        >
          ‹
        </button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              style={{ padding: "5px 4px", color: "#999" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={btnStyle(p === page)}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={btnStyle(false, page === totalPages)}
          title="Next page"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          style={btnStyle(false, page === totalPages)}
          title="Last page"
        >
          »
        </button>
      </div>

      {/* Page size */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
        }}
      >
        <label style={{ color: "#666", fontSize: "12px" }}>Per page:</label>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          style={{
            padding: "5px 8px",
            fontSize: "13px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#fff",
          }}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}