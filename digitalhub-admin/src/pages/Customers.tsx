import { useState } from "react";
import { useCustomers } from "../hooks/useCustomers";
import { useTableState } from "../hooks/useTableState";
import { useFilteredData } from "../hooks/useFilteredData";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import type { Customer } from "../types";
import type { SortOption } from "../components/SearchFilterBar";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
];

const CITY_OPTIONS = [
  { label: "Sydney", value: "Sydney" },
  { label: "Melbourne", value: "Melbourne" },
  { label: "Brisbane", value: "Brisbane" },
  { label: "Perth", value: "Perth" },
  { label: "Adelaide", value: "Adelaide" },
];

export default function Customers() {
  const { customers, loading, error, create, update, remove } = useCustomers();
  const { state, setSearch, setSort, setFilter, setPage, setPageSize } =
    useTableState({ sort: "newest" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { paginated, total } = useFilteredData<Customer>({
    data: customers,
    search: state.search,
    searchFields: ["name", "email", "city"],
    sort: state.sort,
    filters: state.filters,
    filterFieldMap: { city: "city" },
    page: state.page,
    pageSize: state.pageSize,
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!phone.trim()) {
      next.phone = "Phone is required.";
    } else if (!/^\+?[\d\s\-()]{6,20}$/.test(phone.trim())) {
      next.phone = "Enter a valid phone number.";
    }
    if (!city.trim()) next.city = "City is required.";
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCity("");
    setFormErrors({});
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
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

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setCity(customer.city);
    setFormErrors({});
  };

  const handleDelete = async (id: number) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    if (
      !window.confirm(`Are you sure you want to delete "${customer.name}"?`)
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
      <h1>👥 Customers</h1>
      <p>Manage your customers here.</p>
      <hr />

      {/* Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginTop: "20px",
          marginBottom: "4px",
        }}
      >
        <div>
          <input
            type="text"
            placeholder="Full Name"
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
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          {formErrors.email && (
            <div style={errorStyle}>{formErrors.email}</div>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
          {formErrors.phone && (
            <div style={errorStyle}>{formErrors.phone}</div>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={inputStyle}
          />
          {formErrors.city && (
            <div style={errorStyle}>{formErrors.city}</div>
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
          {editingId !== null ? "Save Changes" : "+ Add Customer"}
        </button>
      </div>

      {/* Search + Filter */}
      <SearchFilterBar
        search={state.search}
        onSearchChange={setSearch}
        sort={state.sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        filters={[
          { label: "City", key: "city", options: CITY_OPTIONS },
        ]}
        filterValues={state.filters}
        onFilterChange={setFilter}
        totalResults={total}
        placeholder="Search by name, email or city..."
      />

      {/* Table */}
      {loading ? (
        <p style={{ color: "#999", fontSize: "13px" }}>
          Loading customers...
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
                minWidth: "600px",
              }}
            >
              <thead>
                <tr>
                  <th style={cellStyle}>ID</th>
                  <th style={cellStyle}>Name</th>
                  <th style={cellStyle}>Email</th>
                  <th style={cellStyle}>Phone</th>
                  <th style={cellStyle}>City</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      No customers found.
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
                      <td style={cellStyle}>{c.email}</td>
                      <td style={cellStyle}>{c.phone}</td>
                      <td style={cellStyle}>{c.city}</td>
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