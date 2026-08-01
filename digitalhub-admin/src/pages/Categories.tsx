import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { useTableState } from "../hooks/useTableState";
import { useFilteredData } from "../hooks/useFilteredData";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import type { Category } from "../types";
import type { SortOption } from "../components/SearchFilterBar";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
];

export default function Categories() {
  const { categories, loading, error, create, update, remove } =
    useCategories();
  const { state, setSearch, setSort, setPage, setPageSize } = useTableState({
    sort: "newest",
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { paginated, total } = useFilteredData<Category>({
    data: categories,
    search: state.search,
    searchFields: ["name", "description"],
    sort: state.sort,
    filters: state.filters,
    page: state.page,
    pageSize: state.pageSize,
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Category name is required.";
    if (!description.trim()) next.description = "Description is required.";
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearForm = () => {
    setName("");
    setDescription("");
    setFormErrors({});
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = {
      name: name.trim(),
      description: description.trim(),
    };
    if (editingId !== null) {
      const result = await update(editingId, data);
      if (result.error) {
        setFormErrors({ submit: result.error });
        return;
      }
    } else {
      const result = await create(data);
      if (result.error) {
        setFormErrors({ submit: result.error });
        return;
      }
    }
    clearForm();
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description);
    setFormErrors({});
  };

  const handleDelete = async (id: number) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${category.name}"?`
      )
    )
      return;
    await remove(id);
    if (editingId === id) clearForm();
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
      <h1>🗂️ Categories</h1>
      <p>Manage your product categories here.</p>
      <hr />

      {/* Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "10px",
          marginTop: "20px",
          marginBottom: "4px",
        }}
      >
        <div>
          <input
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          {formErrors.name && (
            <div style={errorStyle}>{formErrors.name}</div>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={inputStyle}
          />
          {formErrors.description && (
            <div style={errorStyle}>{formErrors.description}</div>
          )}
        </div>
      </div>

      {formErrors.submit && (
        <div style={{ color: "red", fontSize: "12px", marginTop: "6px" }}>
          {formErrors.submit}
        </div>
      )}

      <div
        style={{
          marginTop: "16px",
          marginBottom: "20px",
          display: "flex",
          gap: "8px",
        }}
      >
        {editingId !== null && (
          <button
            onClick={clearForm}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          {editingId !== null ? "Save Changes" : "+ Add Category"}
        </button>
      </div>

      {/* Search */}
      <SearchFilterBar
        search={state.search}
        onSearchChange={setSearch}
        sort={state.sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filters={[]}
        filterValues={state.filters}
        totalResults={total}
        placeholder="Search by name or description..."
      />

      {/* Table */}
      {loading ? (
        <p style={{ color: "#999", fontSize: "13px" }}>
          Loading categories...
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
                minWidth: "500px",
              }}
            >
              <thead>
                <tr>
                  <th style={cellStyle}>ID</th>
                  <th style={cellStyle}>Category Name</th>
                  <th style={cellStyle}>Description</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        background:
                          editingId === c.id ? "#fffbe6" : "transparent",
                      }}
                    >
                      <td style={cellStyle}>{c.id}</td>
                      <td style={cellStyle}>{c.name}</td>
                      <td style={cellStyle}>{c.description}</td>
                      <td style={cellStyle}>
                        <button
                          onClick={() => handleEdit(c)}
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
                          onClick={() => handleDelete(c.id)}
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