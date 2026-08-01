import { useEffect, useState } from "react";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { customerRepository } from "../repositories/customer.repository";
import { inventoryRepository } from "../repositories/inventory.repository";
import type { Order, Product, Customer, InventoryItem } from "../types";

type ProductSales = Record<string, { quantity: number; revenue: number }>;
type CategoryRevenue = Record<string, number>;
type StatusSummary = Record<string, number>;

function safeNum(value: unknown): number {
  const n = Number(value ?? 0);
  return isNaN(n) ? 0 : n;
}

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [o, p, c, i] = await Promise.all([
        orderRepository.findAll(),
        productRepository.findAll(),
        customerRepository.findAll(),
        inventoryRepository.findAll(),
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
      setInventory(i);
      setLoading(false);
    };
    load();
  }, []);

  // --- Derived calculations ---
  const totalRevenue = orders.reduce(
    (sum, o) => sum + safeNum(o.totalPrice),
    0
  );

  const avgOrderValue =
    orders.length > 0 ? totalRevenue / orders.length : 0;

  const lowStockCount = inventory.filter(
    (i) => i.status === "Low Stock" || i.status === "Out of Stock"
  ).length;

  const statusSummary: StatusSummary = orders.reduce<StatusSummary>(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const productSales: ProductSales = orders.reduce<ProductSales>((acc, o) => {
    const key = o.productName ?? "Unknown";
    if (!acc[key]) acc[key] = { quantity: 0, revenue: 0 };
    acc[key].quantity += safeNum(o.quantity);
    acc[key].revenue += safeNum(o.totalPrice);
    return acc;
  }, {});

  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categoryRevenue: CategoryRevenue = orders.reduce<CategoryRevenue>(
    (acc, o) => {
      const product = products.find((p) => p.name === o.productName);
      const cat = product?.category ?? "Other";
      acc[cat] = (acc[cat] ?? 0) + safeNum(o.totalPrice);
      return acc;
    },
    {}
  );

  const lowStockItems = inventory
    .filter(
      (i) => i.status === "Low Stock" || i.status === "Out of Stock"
    )
    .sort((a, b) => a.stockQuantity - b.stockQuantity);

  const recentOrders = [...orders].reverse().slice(0, 10);

  // --- Styles ---
  const cellStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "10px",
    textAlign: "left",
  };

  const thStyle: React.CSSProperties = {
    ...cellStyle,
    background: "#f5f5f5",
    fontWeight: 600,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "12px",
    marginTop: 0,
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
  };

  const cardStyle = (color: string): React.CSSProperties => ({
    background: "#fff",
    border: "1px solid #ccc",
    borderTop: `4px solid ${color}`,
    borderRadius: "6px",
    padding: "20px",
    flex: "1 1 160px",
    minWidth: "160px",
  });

  const cardLabel: React.CSSProperties = {
    fontSize: "13px",
    color: "#666",
    marginBottom: "6px",
  };

  const cardValue: React.CSSProperties = {
    fontSize: "26px",
    fontWeight: 700,
    color: "#111",
  };

  const statusColor: Record<string, string> = {
    Pending: "#f59e0b",
    Processing: "#3b82f6",
    Shipped: "#8b5cf6",
    Delivered: "#22c55e",
  };

  const stockStatusColor: Record<string, string> = {
    "In Stock": "#22c55e",
    "Low Stock": "#f59e0b",
    "Out of Stock": "#ef4444",
  };

  if (loading) {
    return (
      <div>
        <h1>📈 Reports</h1>
        <p style={{ color: "#999", fontSize: "13px" }}>Loading reports...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "4px" }}>📈 Reports</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: "24px" }}>
        Overview of your store performance and analytics.
      </p>
      <hr style={{ marginBottom: "24px" }} />

      {/* Summary Cards */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div style={cardStyle("#3b82f6")}>
          <div style={cardLabel}>Total Products</div>
          <div style={cardValue}>{products.length}</div>
        </div>
        <div style={cardStyle("#22c55e")}>
          <div style={cardLabel}>Total Customers</div>
          <div style={cardValue}>{customers.length}</div>
        </div>
        <div style={cardStyle("#f59e0b")}>
          <div style={cardLabel}>Total Orders</div>
          <div style={cardValue}>{orders.length}</div>
        </div>
        <div style={cardStyle("#8b5cf6")}>
          <div style={cardLabel}>Total Revenue (AUD)</div>
          <div style={cardValue}>
            $
            {totalRevenue.toLocaleString("en-AU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div style={cardStyle("#ef4444")}>
          <div style={cardLabel}>Low / Out of Stock</div>
          <div style={cardValue}>{lowStockCount}</div>
        </div>
        <div style={cardStyle("#0ea5e9")}>
          <div style={cardLabel}>Avg Order Value (AUD)</div>
          <div style={cardValue}>
            $
            {avgOrderValue.toLocaleString("en-AU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Sales Summary + Order Status */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          marginBottom: "32px",
          alignItems: "flex-start",
        }}
      >
        {/* Sales Summary */}
        <div style={{ flex: "2 1 400px", minWidth: "300px" }}>
          <h2 style={sectionTitle}>🧾 Sales Summary (Latest 10 Orders)</h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "400px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Order ID</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Total (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ ...cellStyle, textAlign: "center", color: "#999" }}
                    >
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={cellStyle}>#{o.id}</td>
                      <td style={cellStyle}>{o.customerName}</td>
                      <td style={cellStyle}>{o.productName}</td>
                      <td style={cellStyle}>{safeNum(o.quantity)}</td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            color: statusColor[o.status] ?? "#666",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        ${safeNum(o.totalPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
                {recentOrders.length > 0 && (
                  <tr style={{ background: "#f9f9f9" }}>
                    <td
                      colSpan={5}
                      style={{
                        ...cellStyle,
                        fontWeight: 700,
                        textAlign: "right",
                      }}
                    >
                      Total Revenue:
                    </td>
                    <td style={{ ...cellStyle, fontWeight: 700 }}>
                      ${totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Status Summary */}
        <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
          <h2 style={sectionTitle}>📊 Order Status Summary</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(statusSummary).length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      style={{ ...cellStyle, textAlign: "center", color: "#999" }}
                    >
                      No data.
                    </td>
                  </tr>
                ) : (
                  Object.entries(statusSummary).map(([status, count]) => (
                    <tr key={status}>
                      <td style={cellStyle}>
                        <span
                          style={{
                            color: statusColor[status] ?? "#666",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td style={cellStyle}>{count}</td>
                    </tr>
                  ))
                )}
                <tr style={{ background: "#f9f9f9" }}>
                  <td style={{ ...cellStyle, fontWeight: 700 }}>Total</td>
                  <td style={{ ...cellStyle, fontWeight: 700 }}>
                    {orders.length}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products + Revenue by Category */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
          marginBottom: "32px",
          alignItems: "flex-start",
        }}
      >
        {/* Top Products */}
        <div style={{ flex: "2 1 400px", minWidth: "300px" }}>
          <h2 style={sectionTitle}>🏆 Top Products by Revenue</h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "350px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Units Sold</th>
                  <th style={thStyle}>Revenue (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ ...cellStyle, textAlign: "center", color: "#999" }}
                    >
                      No data.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, index) => (
                    <tr key={p.name}>
                      <td style={cellStyle}>{index + 1}</td>
                      <td style={cellStyle}>{p.name}</td>
                      <td style={cellStyle}>{p.quantity}</td>
                      <td style={cellStyle}>
                        ${safeNum(p.revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by Category */}
        <div style={{ flex: "1 1 200px", minWidth: "200px" }}>
          <h2 style={sectionTitle}>💰 Revenue by Category</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Revenue (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(categoryRevenue).length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      style={{ ...cellStyle, textAlign: "center", color: "#999" }}
                    >
                      No data.
                    </td>
                  </tr>
                ) : (
                  Object.entries(categoryRevenue)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, rev]) => (
                      <tr key={cat}>
                        <td style={cellStyle}>{cat}</td>
                        <td style={cellStyle}>
                          ${safeNum(rev).toFixed(2)}
                        </td>
                      </tr>
                    ))
                )}
                {Object.keys(categoryRevenue).length > 0 && (
                  <tr style={{ background: "#f9f9f9" }}>
                    <td style={{ ...cellStyle, fontWeight: 700 }}>Total</td>
                    <td style={{ ...cellStyle, fontWeight: 700 }}>
                      ${totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Report */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={sectionTitle}>⚠️ Low Stock Report</h2>
        {lowStockItems.length === 0 ? (
          <p style={{ color: "#22c55e", fontWeight: 600 }}>
            ✅ All inventory items are sufficiently stocked.
          </p>
        ) : (
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
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>SKU</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Supplier</th>
                  <th style={thStyle}>Stock Qty</th>
                  <th style={thStyle}>Min Stock</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td style={cellStyle}>{item.productName}</td>
                    <td style={cellStyle}>{item.sku}</td>
                    <td style={cellStyle}>{item.category}</td>
                    <td style={cellStyle}>
                      {item.supplier || (
                        <span style={{ color: "#ccc" }}>—</span>
                      )}
                    </td>
                    <td style={cellStyle}>{item.stockQuantity}</td>
                    <td style={cellStyle}>{item.minimumStock}</td>
                    <td style={cellStyle}>
                      {item.warehouseLocation || (
                        <span style={{ color: "#ccc" }}>—</span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          color: stockStatusColor[item.status] ?? "#666",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}