import { useState } from "react";
import { useSuppliers } from "../hooks/useSuppliers";
import { useTableState } from "../hooks/useTableState";
import { useFilteredData } from "../hooks/useFilteredData";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import type { Supplier } from "../types";
import type { SortOption } from "../components/SearchFilterBar";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
];

const COUNTRY_OPTIONS = [
  { label: "Australia", value: "Australia" },
  { label: "United Arab Emirates", value: "United Arab Emirates" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "United States", value: "United States" },
  { label: "Egypt", value: "Egypt" },
];

export default function Suppliers() {
  const { suppliers, loading, error, create, update, remove } = useSuppliers();
  const { state, setSearch, setSort, setFilter, setPage, setPageSize } =
    useTableState({ sort: "newest" });

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { paginated, total } = useFilteredData<Supplier>({
    data: suppliers,
    search: state.search,
    searchFields: ["companyName", "contactPerson", "email", "country"],
    sort: state.sort,
    sortFieldMap: {
      name_asc: "companyName",
      name_desc: "companyName",
    },
    filters: state.filters,
    filterFieldMap: { country: "country" },
    page: state.page,
    pageSize: state.pageSize,
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!companyName.trim()) next.companyName = "Company name is required.";
    if (!contactPerson.trim())
      next.contactPerson = "Contact person is required.";
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
    if (!country.trim()) next.country = "Country is required.";
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearForm = () => {
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setCountry("");
    setFormErrors({});
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = {
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      country: country.trim(),
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

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setCompanyName(supplier.companyName);
    setContactPerson(supplier.contactPerson);
    setEmail(supplier.email);
    setPhone(supplier.phone);
    setCountry(supplier.country);
    setFormErrors({});
  };

  const handleDelete = async (id: number) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${supplier.companyName}"?`
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
      <h1>🏭 Suppliers</h1>
      <p>Manage your suppliers here.</p>
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
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={inputStyle}
          />
          {formErrors.companyName && (
            <div style={errorStyle}>{formErrors.companyName}</div>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="Contact Person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            style={inputStyle}
          />
          {formErrors.contactPerson && (
            <div style={errorStyle}>{formErrors.contactPerson}</div>
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
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={inputStyle}
          />
          {formErrors.country && (
            <div style={errorStyle}>{formErrors.country}</div>
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
          {editingId !== null ? "Save Changes" : "+ Add Supplier"}
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
          { label: "Country", key: "country", options: COUNTRY_OPTIONS },
        ]}
        filterValues={state.filters}
        onFilterChange={setFilter}
        totalResults={total}
        placeholder="Search by company, contact, email or country..."
      />

      {/* Table */}
      {loading ? (
        <p style={{ color: "#999", fontSize: "13px" }}>
          Loading suppliers...
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
                minWidth: "700px",
              }}
            >
              <thead>
                <tr>
                  <th style={cellStyle}>ID</th>
                  <th style={cellStyle}>Company Name</th>
                  <th style={cellStyle}>Contact Person</th>
                  <th style={cellStyle}>Email</th>
                  <th style={cellStyle}>Phone</th>
                  <th style={cellStyle}>Country</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      No suppliers found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((s) => (
                    <tr
                      key={s.id}
                      style={{
                        background:
                          editingId === s.id ? "#fffbe6" : "transparent",
                      }}
                    >
                      <td style={cellStyle}>{s.id}</td>
                      <td style={cellStyle}>{s.companyName}</td>
                      <td style={cellStyle}>{s.contactPerson}</td>
                      <td style={cellStyle}>{s.email}</td>
                      <td style={cellStyle}>{s.phone}</td>
                      <td style={cellStyle}>{s.country}</td>
                      <td style={cellStyle}>
                        <button
                          onClick={() => handleEdit(s)}
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
                          onClick={() => handleDelete(s.id)}
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