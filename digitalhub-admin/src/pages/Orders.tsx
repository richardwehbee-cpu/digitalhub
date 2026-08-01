import { useState, useEffect } from "react";
import { useOrders } from "../hooks/useOrders";
import { useTableState } from "../hooks/useTableState";
import { useFilteredData } from "../hooks/useFilteredData";
import SearchFilterBar from "../components/SearchFilterBar";
import Pagination from "../components/Pagination";
import InvoiceModal from "../components/InvoiceModal";
import {
  getInvoiceByOrderId,
  createInvoiceFromOrder,
  upsertInvoice,
} from "../services/invoices";
import { productRepository } from "../repositories/product.repository";
import { customerRepository } from "../repositories/customer.repository";
import { inventoryRepository } from "../repositories/inventory.repository";
import { addNotification } from "../services/notifications";
import type { Order, Product, Customer } from "../types";
import type { Invoice } from "../services/invoices";
import type { SortOption } from "../components/SearchFilterBar";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
];

const STATUS_FILTER_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Processing", value: "Processing" },
  { label: "Shipped", value: "Shipped" },
  { label: "Delivered", value: "Delivered" },
];

const STATUS_OPTIONS: Order["status"][] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
];

const statusColor: Record<Order["status"], string> = {
  Pending: "#f59e0b",
  Processing: "#3b82f6",
  Shipped: "#8b5cf6",
  Delivered: "#22c55e",
};

function deriveStockStatus(
  qty: number,
  min: number
): "In Stock" | "Low Stock" | "Out of Stock" {
  if (qty === 0) return "Out of Stock";
  if (qty <= min) return "Low Stock";
  return "In Stock";
}

export default function Orders() {
  const { orders, loading, error, create, update, remove, refresh } =
    useOrders();
  const { state, setSearch, setSort, setFilter, setPage, setPageSize } =
    useTableState({ sort: "newest" });

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [status, setStatus] = useState<Order["status"]>("Pending");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stockError, setStockError] = useState("");
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const loadDependencies = async () => {
    const [p, c] = await Promise.all([
      productRepository.findAll(),
      customerRepository.findAll(),
    ]);
    setProducts(p);
    setCustomers(c);
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    const qty = parseInt(quantity, 10);
    if (!isNaN(qty) && qty > 0 && unitPrice > 0) {
      setTotalPrice(parseFloat((unitPrice * qty).toFixed(2)));
    } else {
      setTotalPrice(0);
    }
  }, [unitPrice, quantity]);

  const { paginated, total } = useFilteredData<Order>({
    data: orders,
    search: state.search,
    searchFields: ["customerName", "productName", "status"],
    sort: state.sort,
    sortFieldMap: {
      name_asc: "customerName",
      name_desc: "customerName",
    },
    filters: state.filters,
    filterFieldMap: { status: "status" },
    page: state.page,
    pageSize: state.pageSize,
  });

  const handleProductChange = (productName: string) => {
    setSelectedProduct(productName);
    setStockError("");
    const found = products.find((p) => p.name === productName);
    setUnitPrice(found ? found.price : 0);
    setQuantity("");
    setTotalPrice(0);
  };

  const getAvailableStock = (): number => {
    const found = products.find((p) => p.name === selectedProduct);
    return found ? found.stock : 0;
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    setStockError("");

    if (!selectedCustomer) next.customerName = "Please select a customer.";
    if (!selectedProduct) next.productName = "Please select a product.";

    if (!quantity.trim()) {
      next.quantity = "Quantity is required.";
    } else if (
      isNaN(Number(quantity)) ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      next.quantity = "Quantity must be a whole number greater than 0.";
    } else if (editingId === null) {
      const available = getAvailableStock();
      if (Number(quantity) > available) {
        setStockError(
          `Insufficient stock. Available: ${available} unit(s) for "${selectedProduct}".`
        );
        return false;
      }
    }

    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearForm = () => {
    setSelectedCustomer("");
    setSelectedProduct("");
    setUnitPrice(0);
    setQuantity("");
    setTotalPrice(0);
    setStatus("Pending");
    setFormErrors({});
    setStockError("");
    setEditingId(null);
  };

  const deductStock = async (productName: string, qty: number) => {
    const allProducts = await productRepository.findAll();
    const target = allProducts.find((p) => p.name === productName);
    if (!target) return;

    const newStock = Math.max(0, target.stock - qty);
    await productRepository.update(target.id, { stock: newStock });

    const allInventory = await inventoryRepository.findAll();
    const invItem = allInventory.find((i) => i.productName === productName);
    if (invItem) {
      await inventoryRepository.update(invItem.id, {
        stockQuantity: newStock,
        status: deriveStockStatus(newStock, invItem.minimumStock),
      });
    }

    if (newStock === 0) {
      addNotification(
        "out_of_stock",
        `"${productName}" is now out of stock.`
      );
    } else if (newStock <= 5) {
      addNotification(
        "low_stock",
        `Low stock alert: "${productName}" has only ${newStock} unit(s) left.`
      );
    }

    await loadDependencies();
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const qty = parseInt(quantity, 10);
    const total = parseFloat((unitPrice * qty).toFixed(2));

    if (editingId !== null) {
      const result = await update(
        editingId,
        {
          customerName: selectedCustomer,
          productName: selectedProduct,
          quantity: qty,
          totalPrice: total,
          status,
        },
        unitPrice
      );
      if (result.error) {
        setFormErrors({ submit: result.error });
        return;
      }
      clearForm();
      return;
    }

    await deductStock(selectedProduct, qty);

    const result = await create(
      {
        customerName: selectedCustomer,
        productName: selectedProduct,
        quantity: qty,
        totalPrice: total,
        status,
      },
      unitPrice
    );

    if (result.error) {
      setFormErrors({ submit: result.error });
      return;
    }

    await refresh();
    clearForm();
  };

  const handleEdit = (order: Order) => {
    setEditingId(order.id);
    setSelectedCustomer(order.customerName);
    setSelectedProduct(order.productName);
    const found = products.find((p) => p.name === order.productName);
    setUnitPrice(found ? found.price : 0);
    setQuantity(String(order.quantity));
    setTotalPrice(order.totalPrice);
    setStatus(order.status);
    setFormErrors({});
    setStockError("");
  };

  const handleDelete = async (id: number) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (
      !window.confirm(
        `Delete order for "${order.customerName}" — ${order.productName}?`
      )
    )
      return;
    await remove(id);
    if (editingId === id) clearForm();
  };

  const handleViewInvoice = (orderId: number) => {
    const existing = getInvoiceByOrderId(orderId);
    if (existing) {
      setViewingInvoice(existing);
      return;
    }
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const product = products.find((p) => p.name === order.productName);
    const customer = customers.find((c) => c.name === order.customerName);
    const generated = createInvoiceFromOrder(
      order,
      product?.price ?? order.totalPrice / Math.max(order.quantity, 1),
      customer
    );
    upsertInvoice(generated);
    setViewingInvoice(generated);
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

  const availableStock = getAvailableStock();

  return (
    <div>
      {viewingInvoice && (
        <InvoiceModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      <h1>🧾 Orders</h1>
      <p>Manage your orders here.</p>
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
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              display: "block",
              marginBottom: "4px",
            }}
          >
            Customer
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Select Customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {formErrors.customerName && (
            <div style={errorStyle}>{formErrors.customerName}</div>
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
            Product
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => handleProductChange(e.target.value)}
            style={inputStyle}
          >
            <option value="">— Select Product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.name} disabled={p.stock === 0}>
                {p.name} — ${p.price} (Stock: {p.stock})
              </option>
            ))}
          </select>
          {formErrors.productName && (
            <div style={errorStyle}>{formErrors.productName}</div>
          )}
          {selectedProduct && (
            <div
              style={{
                fontSize: "11px",
                marginTop: "2px",
                fontWeight: 600,
                color:
                  availableStock === 0
                    ? "#ef4444"
                    : availableStock <= 5
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            >
              Available stock: {availableStock}
            </div>
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
            Unit Price (AUD)
          </label>
          <input
            type="text"
            value={selectedProduct ? `$${unitPrice.toFixed(2)}` : ""}
            readOnly
            placeholder="Auto-filled"
            style={{
              ...inputStyle,
              background: "#f5f5f5",
              color: "#555",
              cursor: "not-allowed",
            }}
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
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            min="1"
            step="1"
            style={inputStyle}
          />
          {formErrors.quantity && (
            <div style={errorStyle}>{formErrors.quantity}</div>
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
            Total Price (AUD)
          </label>
          <input
            type="text"
            value={totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : ""}
            readOnly
            placeholder="Auto-calculated"
            style={{
              ...inputStyle,
              background: "#f5f5f5",
              color: "#555",
              cursor: "not-allowed",
            }}
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
            value={status}
            onChange={(e) => setStatus(e.target.value as Order["status"])}
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

      {stockError && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 12px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "4px",
            color: "#dc2626",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          ⚠️ {stockError}
        </div>
      )}

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
          {editingId !== null ? "Save Changes" : "+ Add Order"}
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
          { label: "Status", key: "status", options: STATUS_FILTER_OPTIONS },
        ]}
        filterValues={state.filters}
        onFilterChange={setFilter}
        totalResults={total}
        placeholder="Search by customer, product or status..."
      />

      {/* Table */}
      {loading ? (
        <p style={{ color: "#999", fontSize: "13px" }}>Loading orders...</p>
      ) : error ? (
        <p style={{ color: "red", fontSize: "13px" }}>{error}</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "820px",
              }}
            >
              <thead>
                <tr>
                  <th style={cellStyle}>ID</th>
                  <th style={cellStyle}>Customer</th>
                  <th style={cellStyle}>Product</th>
                  <th style={cellStyle}>Qty</th>
                  <th style={cellStyle}>Total (AUD)</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Invoice</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        color: "#999",
                      }}
                    >
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((order) => (
                    <tr
                      key={order.id}
                      style={{
                        background:
                          editingId === order.id ? "#fffbe6" : "transparent",
                      }}
                    >
                      <td style={cellStyle}>#{order.id}</td>
                      <td style={cellStyle}>{order.customerName}</td>
                      <td style={cellStyle}>{order.productName}</td>
                      <td style={cellStyle}>{order.quantity}</td>
                      <td style={cellStyle}>
                        ${Number(order.totalPrice ?? 0).toFixed(2)}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            color: statusColor[order.status] ?? "#666",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <button
                          onClick={() => handleViewInvoice(order.id)}
                          style={{
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          🧾 View
                        </button>
                      </td>
                      <td style={cellStyle}>
                        <button
                          onClick={() => handleEdit(order)}
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
                          onClick={() => handleDelete(order.id)}
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