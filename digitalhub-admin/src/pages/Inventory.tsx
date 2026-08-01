import { useState } from "react";
import { useInventory } from "../hooks/useInventory";
import { useTableState } from "../hooks/useTableState";
import { useFilteredData } from "../hooks/useFilteredData";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import type { InventoryItem } from "../types";
import type { SortOption } from "../components/SearchFilterBar";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
  { label: "Stock ↑", value: "stock_asc" },
  { label: "Stock ↓", value: "stock_desc" },
];

const STATUS_FILTER_OPTIONS = [
  { label: "In Stock", value: "In Stock" },
  { label: "Low Stock", value: "Low Stock" },
  { label: "Out of Stock", value: "Out of Stock" },
];

const STATUS_OPTIONS: InventoryItem["status"][] = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
];

const statusColor: Record<InventoryItem["status"], string> = {
  "In Stock": "#22c55e",
  "Low Stock": "#f59e0b",
  "Out of Stock": "#ef4444",
};

export default function Inventory() {
  const { inventory, loading, error, update, remove } = useInventory();
  const { state, setSearch, setSort, setFilter, setPage, setPageSize } =
    useTableState({ sort: "newest" });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSku, setEditSku] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editMinimumStock, setEditMinimumStock] = useState("");
  const [editWarehouseLocation, setEditWarehouseLocation] = useState("");
  const [editStatus, setEditStatus] =
    useState<InventoryItem["status"]>("In Stock");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { paginated, total } = useFilteredData<InventoryItem>({
    data: inventory,
    search: state.search,
    searchFields: [
      "productName",
      "sku",
      "category",
      "supplier",
      "warehouseLocation",
      "status",
    ],
    sort: state.sort,
    sortFieldMap: {
      name_asc: "productName",
      name_desc: "productName",
      stock_asc: "stockQuantity",
      stock_desc: "stockQuantity",
    },
    filters: state.filters,
    filterFieldMap: { status: "status" },
    page: state.page,
    pageSize: state.pageSize,
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!editSku.trim()) next.sku = "SKU is required.";
    if (!editMinimumStock.trim()) {
      next.minimumStock = "Minimum stock is required.";
    } else if (
      isNaN(Number(editMinimumStock)) ||
      !Number.isInteger(Number(editMinimumStock)) ||
      Number(editMinimumStock) < 0
    ) {
      next.minimumStock = "Must be a whole number (0 or more).";
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditSku(item.sku);
    setEditSupplier(item.supplier);
    setEditMinimumStock(String(item.minimumStock));
    setEditWarehouseLocation(item.warehouseLocation);
    setEditStatus(item.status);
    setFormErrors({});
  };

  const handleSaveEdit = async () => {
    if (!validate() || editingId === null) return;
    const result = await update(editingId, {
      sku: editSku.trim(),
      supplier: editSupplier.trim(),
      minimumStock: parseInt(editMinimumStock, 10),
      warehouseLocation: editWarehouseLocation.trim(),
      status: editStatus,
    });
    if (result.error) {
      setFormErrors({ submit: result.error });
      return;
    }
    clearForm();
  };

  const handleDelete = async (id: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    if (
      !window.confirm(
        `Remove "${item.productName}" from inventory? This will also delete the product.`
      )
    )
      return;
    await remove(id);
    if (editingId === id) clearForm();
  };

  const clearForm = () => {
    setEditingId(null);
    setEditSku("");
    setEditSupplier("");
    setEditMinimumStock("");
    setEditWarehouseLocation("");
    setEditStatus("In Stock");
    setFormErrors({});
  };

  const cellStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "10px",
  };

  const errorStyle: React.CSSProperties = {
    color: "red",
    fontSize: "12px",
    marginTop: "2px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    fontSize: "13px",
  };

  return (
    <div>
      <h1>📦 Inventory</h1>
      <p>
        Live inventory synced from Products. Stock updates automatically after
        orders.
      </p>
      <hr />

      {/* Edit form — only shown when editing */}
      {editingId !== null && (
        <div
          style={{
            background: "#fffbe6",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "16px",
            marginTop: "20px",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
            Edit —{" "}
            {inventory.find((i) => i.id === editingId)?.productName ?? ""}
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                SKU
              </label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                style={inputStyle}
              />
              {formErrors.sku && (
                <div style={errorStyle}>{formErrors.sku}</div>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Supplier
              </label>
              <input
                type="text"
                value={editSupplier}
                onChange={(e) => setEditSupplier(e.target.value)}
                placeholder="Supplier name"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Minimum Stock
              </label>
              <input
                type="number"
                value={editMinimumStock}
                onChange={(e) => setEditMinimumStock(e.target.value)}
                min="0"
                step="1"
                style={inputStyle}
              />
              {formErrors.minimumStock && (
                <div style={errorStyle}>{formErrors.minimumStock}</div>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Warehouse Location
              </label>
              <input
                type="text"
                value={editWarehouseLocation}
                onChange={(e) => setEditWarehouseLocation(e.target.value)}
                placeholder="e.g. A1-01"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as InventoryItem["status"])
                }
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formErrors.submit && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "6px" }}>
              {formErrors.submit}
            </div>
          )}

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "8px",
            }}
          >
            <button
              onClick={handleSaveEdit}
              style={{ padding: "8px 16px", cursor: "pointer" }}
            >
              Save Changes
            </button>
            <button
              onClick={clearForm}
              style={{ padding: "8px 16px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <SearchFilterBar
        search={state.search}
        onSearchChange={setSearch}
        sort={state.sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filters={[
          {
            label: "Status",
            key: "status",
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
        filterValues={state.filters}
        onFilterChange={setFilter}
        totalResults={total}
        placeholder="Search by product, SKU, category or supplier..."
      />

      {/* Table */}
      {loading ? (
        <p style={{ color: "#999", fontSize: "13px" }}>
          Loading inventory...
        </p>
      ) : error ? (
        <p style={{ color: "red", fontSize: "13px" }}>{error}</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr>
                  <th style={cellStyle}>ID</th>
                  <th style={cellStyle}>Product Name</th>
                  <th style={cellStyle}>SKU</th>
                  <th style={cellStyle}>Category</th>
                  <th style={cellStyle}>Supplier</th>
                  <th style={cellStyle}>Stock Qty</th>
                  <th style={cellStyle}>Min Stock</th>
                  <th style={cellStyle}>Location</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      No inventory items found. Add products on the Products
                      page.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        background:
                          editingId === item.id ? "#fffbe6" : "transparent",
                      }}
                    >
                      <td style={cellStyle}>{item.id}</td>
                      <td style={cellStyle}>{item.productName}</td>
                      <td style={cellStyle}>{item.sku}</td>
                      <td style={cellStyle}>{item.category}</td>
                      <td style={cellStyle}>
                        {item.supplier || (
                          <span style={{ color: "#ccc" }}>—</span>
                        )}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: statusColor[item.status],
                          }}
                        >
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td style={cellStyle}>{item.minimumStock}</td>
                      <td style={cellStyle}>
                        {item.warehouseLocation || (
                          <span style={{ color: "#ccc" }}>—</span>
                        )}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            color: statusColor[item.status],
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <button
                          onClick={() => handleEdit(item)}
                          style={{
                            background: "orange",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginRight: "8px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            background: "red",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={state.page}
            pageSize={state.pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}