import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface Order {
  id: number;
  customerName: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered";
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
}

interface ActivityEntry {
  id: number;
  message: string;
  time: string;
}

const ORDERS_KEY = "digitalhub_orders";
const PRODUCTS_KEY = "digitalhub_products";
const CUSTOMERS_KEY = "digitalhub_customers";
const ACTIVITY_KEY = "digitalhub_activity";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#f97316"];

function loadJSON<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {}
  return [];
}

function safeNum(value: unknown): number {
  const n = Number(value ?? 0);
  return isNaN(n) ? 0 : n;
}

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setOrders(loadJSON<Order>(ORDERS_KEY));
    setProducts(loadJSON<Product>(PRODUCTS_KEY));
    setCustomers(loadJSON<Customer>(CUSTOMERS_KEY));
    setActivity(loadJSON<ActivityEntry>(ACTIVITY_KEY));
  }, []);

  // --- Derived data ---
  const totalRevenue = orders.reduce((sum, o) => sum + safeNum(o.totalPrice), 0);
  const recentOrders = [...orders].reverse().slice(0, 5);
  const lowStockProducts = products
    .filter((p) => safeNum(p.stock) <= 5)
    .sort((a, b) => safeNum(a.stock) - safeNum(b.stock));

  // Revenue Line Chart — revenue per order (last 10)
  const revenueChartData = [...orders]
    .slice(-10)
    .map((o, i) => ({
      name: `#${o.id}`,
      Revenue: safeNum(o.totalPrice),
    }));

  // Orders Bar Chart — orders per product
  const ordersByProduct: Record<string, number> = {};
  for (const o of orders) {
    const key = o.productName ?? "Unknown";
    ordersByProduct[key] = (ordersByProduct[key] ?? 0) + safeNum(o.quantity);
  }
  const ordersBarData = Object.entries(ordersByProduct)
    .map(([name, qty]) => ({ name, Orders: qty }))
    .sort((a, b) => b.Orders - a.Orders)
    .slice(0, 8);

  // Category Pie Chart
  const categoryCount: Record<string, number> = {};
  for (const p of products) {
    const cat = p.category || "Other";
    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
  }
  const categoryPieData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  // Order Status Pie Chart
  const statusCount: Record<string, number> = {};
  for (const o of orders) {
    const s = o.status ?? "Unknown";
    statusCount[s] = (statusCount[s] ?? 0) + 1;
  }
  const statusPieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  const addActivity = (message: string) => {
    const entry: ActivityEntry = { id: Date.now(), message, time: "Just now" };
    const updated = [entry, ...activity].slice(0, 10);
    setActivity(updated);
    try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated)); } catch {}
  };

  const statusColor: Record<string, string> = {
    Pending: "#f59e0b",
    Processing: "#3b82f6",
    Shipped: "#8b5cf6",
    Delivered: "#22c55e",
  };

  const stockStatusLabel = (stock: number): { label: string; color: string } => {
    if (stock === 0) return { label: "Out of Stock", color: "#ef4444" };
    if (stock <= 3) return { label: "Critical", color: "#f97316" };
    return { label: "Low Stock", color: "#f59e0b" };
  };

  // --- Styles ---
  const cardStyle = (color: string): React.CSSProperties => ({
    background: "#fff", border: "1px solid #ccc",
    borderTop: `4px solid ${color}`, borderRadius: "6px",
    padding: "20px", flex: "1 1 180px", minWidth: "180px",
  });
  const cellStyle: React.CSSProperties = { border: "1px solid #ccc", padding: "10px", textAlign: "left" };
  const thStyle: React.CSSProperties = { ...cellStyle, background: "#f5f5f5", fontWeight: 600 };
  const sectionTitle: React.CSSProperties = {
    fontSize: "16px", fontWeight: 700, marginBottom: "12px",
    marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "8px",
  };
  const cardLabel: React.CSSProperties = { fontSize: "13px", color: "#666", marginBottom: "6px" };
  const cardValue: React.CSSProperties = { fontSize: "28px", fontWeight: 700, color: "#111" };
  const chartBox: React.CSSProperties = {
    background: "#fff", border: "1px solid #ccc",
    borderRadius: "6px", padding: "20px",
    flex: "1 1 340px", minWidth: "300px",
  };
  const chartTitle: React.CSSProperties = {
    fontSize: "14px", fontWeight: 700,
    marginBottom: "16px", marginTop: 0, color: "#333",
  };
  const emptyChart: React.CSSProperties = {
    height: "200px", display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "#999", fontSize: "13px",
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "4px" }}>📊 Dashboard</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: "24px" }}>
        Welcome back, Admin. Here is what is happening today.
      </p>
      <hr style={{ marginBottom: "24px" }} />

      {/* Summary Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
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
            ${totalRevenue.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={sectionTitle}>⚡ Quick Actions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button
            onClick={() => { addActivity("Quick action: Add Product clicked"); window.location.href = "/products"; }}
            style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: 600 }}
          >+ Add Product</button>
          <button
            onClick={() => { addActivity("Quick action: Add Customer clicked"); window.location.href = "/customers"; }}
            style={{ padding: "10px 20px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: 600 }}
          >+ Add Customer</button>
          <button
            onClick={() => { addActivity("Quick action: Create Order clicked"); window.location.href = "/orders"; }}
            style={{ padding: "10px 20px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: 600 }}
          >+ Create Order</button>
        </div>
      </div>

      {/* Charts Row 1 — Revenue + Orders */}
      <h2 style={sectionTitle}>📈 Analytics</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>

        {/* Revenue Line Chart */}
        <div style={chartBox}>
          <h3 style={chartTitle}>Revenue per Order (Last 10)</h3>
          {revenueChartData.length === 0 ? (
            <div style={emptyChart}>No order data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Bar Chart */}
        <div style={chartBox}>
          <h3 style={chartTitle}>Units Ordered per Product</h3>
          {ordersBarData.length === 0 ? (
            <div style={emptyChart}>No order data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 — Pies */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "32px" }}>

        {/* Category Pie */}
        <div style={chartBox}>
          <h3 style={chartTitle}>Products by Category</h3>
          {categoryPieData.length === 0 ? (
            <div style={emptyChart}>No product data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={true}
                >
                  {categoryPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Pie */}
        <div style={chartBox}>
          <h3 style={chartTitle}>Orders by Status</h3>
          {statusPieData.length === 0 ? (
            <div style={emptyChart}>No order data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={true}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={statusColor[entry.name] ?? PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders + Activity */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "32px", alignItems: "flex-start" }}>
        <div style={{ flex: "2 1 400px", minWidth: "300px" }}>
          <h2 style={sectionTitle}>🧾 Recent Orders</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Order ID</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...cellStyle, textAlign: "center", color: "#999" }}>
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={cellStyle}>#{order.id}</td>
                      <td style={cellStyle}>{order.customerName}</td>
                      <td style={cellStyle}>{order.productName}</td>
                      <td style={cellStyle}>
                        <span style={{ color: statusColor[order.status] ?? "#666", fontWeight: 600, fontSize: "13px" }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={cellStyle}>${safeNum(order.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ flex: "1 1 220px", minWidth: "220px" }}>
          <h2 style={sectionTitle}>🕐 Recent Activity</h2>
          <div style={{ border: "1px solid #ccc", borderRadius: "6px", padding: "12px", background: "#fff", maxHeight: "300px", overflowY: "auto" }}>
            {activity.length === 0 ? (
              <p style={{ color: "#999", fontSize: "13px" }}>No activity yet.</p>
            ) : (
              activity.map((entry) => (
                <div key={entry.id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "10px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "13px", color: "#111" }}>{entry.message}</div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{entry.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={sectionTitle}>⚠️ Low Stock Products</h2>
        {lowStockProducts.length === 0 ? (
          <p style={{ color: "#22c55e", fontWeight: 600 }}>✅ All products are sufficiently stocked.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "300px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Stock</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => {
                  const { label, color } = stockStatusLabel(safeNum(product.stock));
                  return (
                    <tr key={product.id}>
                      <td style={cellStyle}>{product.name}</td>
                      <td style={cellStyle}>{product.stock}</td>
                      <td style={cellStyle}>
                        <span style={{ color, fontWeight: 600, fontSize: "13px" }}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;