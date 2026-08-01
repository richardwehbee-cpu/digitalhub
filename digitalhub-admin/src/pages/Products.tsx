import { useState, useEffect, useRef } from "react";
import { addNotification } from "../services/notifications";
import { useProducts } from "../hooks/useProducts";
import { useTableState } from "../hooks/useTableState";
import { useFilteredData } from "../hooks/useFilteredData";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import type { Product } from "../types";
import type { SortOption } from "../components/SearchFilterBar";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
  { label: "Price ↑", value: "price_asc" },
  { label: "Price ↓", value: "price_desc" },
  { label: "Stock ↑", value: "stock_asc" },
  { label: "Stock ↓", value: "stock_desc" },
];

const CATEGORY_OPTIONS = [
  { label: "Electronics", value: "Electronics" },
  { label: "Accessories", value: "Accessories" },
  { label: "Gift Cards", value: "Gift Cards" },
];

export default function Products() {
  const { products, loading, create, update, remove } = useProducts();
  const { state, setSearch, setSort, setFilter, setPage, setPageSize } =
    useTableState({ sort: "newest" });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { paginated, total } = useFilteredData<Product>({
    data: products,
    search: state.search,
    searchFields: ["name", "category"],
    sort: state.sort,
    filters: state.filters,
    filterFieldMap: { category: "category" },
    page: state.page,
    pageSize: state.pageSize,
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!category.trim()) next.category = "Category is required.";
    if (!price.trim()) {
      next.price = "Price is required.";
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      next.price = "Price must be a valid number.";
    }
    if (!stock.trim()) {
      next.stock = "Stock is required.";
    } else if (
      isNaN(Number(stock)) ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      next.stock = "Stock must be a whole number.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearForm = () => {
    setName(""); setCategory(""); setPrice(""); setStock("");
    setImageBase64(""); setImagePreview(""); setErrors({}); setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, image: "Please select a valid image file." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((p) => ({ ...p, image: "Image must be smaller than 2MB." }));
      return;
    }
    setErrors((p) => { const n = { ...p }; delete n.image; return n; });
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setImageBase64(b64); setImagePreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageBase64(""); setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const stockNum = Number(stock);

    if (editingId !== null) {
      const existing = products.find((p) => p.id === editingId);
      await update(editingId, {
        name: name.trim(), category: category.trim(),
        price: Number(price), stock: stockNum,
        image: imageBase64 || existing?.image || "",
      });
      clearForm();
      return;
    }

    const result = await create({
      name: name.trim(), category: category.trim(),
      price: Number(price), stock: stockNum, image: imageBase64,
    });

    if (result.error) {
      setErrors({ submit: result.error });
      return;
    }

    if (stockNum === 0) {
      addNotification("out_of_stock", `New product "${name.trim()}" added with zero stock.`);
    } else if (stockNum <= 5) {
      addNotification("low_stock", `New product "${name.trim()}" added with low stock (${stockNum} unit(s)).`);
    }
    clearForm();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name); setCategory(product.category);
    setPrice(String(product.price)); setStock(String(product.stock));
    setImageBase64(product.image || ""); setImagePreview(product.image || "");
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    await remove(id);
    if (editingId === id) clearForm();
  };

  const cellStyle = { border: "1px solid #ccc", padding: "10px" };
  const errorStyle = { color: "red", fontSize: "12px", marginTop: "2px" };
  const inputStyle = { width: "100%", padding: "8px", boxSizing: "border-box" as const };

  return (
    <div>
      <h1>📦 Products</h1>
      <p>Manage your products here.</p>
      <hr />

      {/* Form */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "20px", marginBottom: "4px" }}>
        <div>
          <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          {errors.name && <div style={errorStyle}>{errors.name}</div>}
        </div>
        <div>
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
          {errors.category && <div style={errorStyle}>{errors.category}</div>}
        </div>
        <div>
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
          {errors.price && <div style={errorStyle}>{errors.price}</div>}
        </div>
        <div>
          <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} style={inputStyle} />
          {errors.stock && <div style={errorStyle}>{errors.stock}</div>}
        </div>
      </div>

      {/* Image upload */}
      <div style={{ marginTop: "10px", marginBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Product Image (optional, max 2MB)
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ width: "100%", padding: "6px 0", fontSize: "13px" }} />
            {errors.image && <div style={errorStyle}>{errors.image}</div>}
            {editingId !== null && !imagePreview && (
              <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Leave empty to keep the existing image.</div>
            )}
          </div>
          {imagePreview && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <img src={imagePreview} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", border: "1px solid #ccc", borderRadius: "4px" }} />
              <button onClick={handleRemoveImage} style={{ fontSize: "11px", padding: "3px 8px", cursor: "pointer", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "4px", color: "#dc2626" }}>Remove</button>
            </div>
          )}
        </div>
      </div>

      {errors.submit && <div style={{ ...errorStyle, marginTop: "8px" }}>{errors.submit}</div>}

      <div style={{ marginTop: "16px", marginBottom: "20px", display: "flex", gap: "8px" }}>
        {editingId !== null && (
          <button onClick={clearForm} style={{ padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
        )}
        <button onClick={handleSubmit} style={{ padding: "8px 16px", cursor: "pointer" }}>
          {editingId !== null ? "Save Changes" : "+ Add Product"}
        </button>
      </div>

      {/* Search + Filter */}
      <SearchFilterBar
        search={state.search}
        onSearchChange={setSearch}
        sort={state.sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filters={[{ label: "Category", key: "category", options: CATEGORY_OPTIONS }]}
        filterValues={state.filters}
        onFilterChange={setFilter}
        totalResults={total}
        placeholder="Search by name or category..."
      />

      {/* Table */}
      {loading ? (
        <p style={{ color: "#999", fontSize: "13px" }}>Loading products...</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={cellStyle}>Image</th>
                  <th style={cellStyle}>ID</th>
                  <th style={cellStyle}>Name</th>
                  <th style={cellStyle}>Category</th>
                  <th style={cellStyle}>Price</th>
                  <th style={cellStyle}>Stock</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...cellStyle, textAlign: "center", color: "#999" }}>
                      No products found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((product) => (
                    <tr key={product.id} style={{ background: editingId === product.id ? "#fffbe6" : "transparent" }}>
                      <td style={{ ...cellStyle, textAlign: "center", width: "70px" }}>
                        {product.image ? (
                          <img src={product.image} alt={product.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd", display: "block", margin: "0 auto" }} />
                        ) : (
                          <div style={{ width: "48px", height: "48px", background: "#f3f4f6", border: "1px solid #ddd", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", margin: "0 auto" }}>📦</div>
                        )}
                      </td>
                      <td style={cellStyle}>{product.id}</td>
                      <td style={cellStyle}>{product.name}</td>
                      <td style={cellStyle}>{product.category}</td>
                      <td style={cellStyle}>${product.price}</td>
                      <td style={cellStyle}>
                        <span style={{ fontWeight: 600, color: product.stock === 0 ? "#ef4444" : product.stock <= 5 ? "#f59e0b" : "#22c55e" }}>
                          {product.stock}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <button onClick={() => handleEdit(product)} style={{ background: "orange", color: "white", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer", marginRight: "8px" }}>Edit</button>
                        <button onClick={() => handleDelete(product.id)} style={{ background: "red", color: "white", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer" }}>Delete</button>
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