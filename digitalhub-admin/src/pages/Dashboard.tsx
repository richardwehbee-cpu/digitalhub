import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { customerRepository } from "../repositories/customer.repository";
import { inventoryRepository } from "../repositories/inventory.repository";
import type { Order, Product, Customer, InventoryItem } from "../types";

interface ActivityEntry {
  id: number;
  message: string;
  time: string;
}

const ACTIVITY_KEY = "digitalhub_activity";
const PIE_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b",
  "#ef4444", "#8b5cf6", "#0ea5e9", "#f97316",
];

function loadActivity(): ActivityEntry[] {
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) return parsed as ActivityEntry[];
    }
  } catch {}
  return [];
}

function safeNum(value: unknown): number {
  const n = Number(value ?? 0);
  return isNaN(n) ? 0 : n;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [o, p, c, i] = await Promise.all([
          orderRepository.findAll(),
          productRepository.findAll(),
          customerRepository.findAll(),
          inventoryRepository.findAll(),
        ]);
        setOrders(o);
        setProducts(p);
        setCustomers(c);
        setInventory(Array.isArray(i) ? i : []);
      } catch {
        // fail silently — individual sections show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
    setActivity(loadActivity());
  }, []);

  const totalRevenue = orders.reduce(
    (sum, o) => sum + safeNum(o.totalPrice), 0
  );

  const recentOrders = [...orders].reverse().slice(0, 5);

  const lowStockProducts = products
    .filter((p) => safeNum(p.stock) <= 5)
    .sort((a, b) => safeNum(a.stock) - safeNum(b.stock));

  // Revenue line chart — last 10 orders
  const revenueChartData = [...orders].slice(-10).map((o) => ({
    name: `${String(o.id).slice(0, 6)}`,
    Revenue: safeNum(o.totalPrice),
  }));

  // Orders bar chart — units per product
  const ordersByProduct: Record<string, number> = {};
  for (const o of orders) {
    const key = o.productName ?? "Unknown";
    ordersByProduct[key] = (ordersByProduct[key] ?? 0) + safeNum(o.quantity);
  }
  const ordersBarData = Object.entries(ordersByProduct)
    .map(([name, Orders]) => ({ name, Orders }))
    .sort((a, b) => b.Orders - a.Orders)
    .slice(0, 8);

  // Category pie
  const categoryCount: Record<string, number> = {};
  for (const p of products) {
    const cat = p.category || "Other";
    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
  }
  const categoryPieData = Object.entries(categoryCount).map(
    ([name, value]) => ({ name, value })
  );

  // Status pie
  const statusCount: Record<string, number> = {};
  for (const o of orders) {
    const s = o.status ?? "Unknown";
    statusCount[s] = (statusCount[s] ?? 0) + 1;
  }
  const statusPieData = Object.entries(statusCount).map(
    ([name, value]) => ({ name, value })
  );

  const addActivity = (message: string) => {
    const entry: ActivityEntry = { id: Date.now(), message, time: "Just now" };
    const updated = [entry, ...activity].slice(0, 10);
    setActivity(updated);
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const statusColor: Record<string, string> = {
    Pending:    "#f59e0b",
    Processing: "#3b82f6",
    Shipped:    "#8b5cf6",
    Delivered:  "#22c55e",
  };

  const stockStatusLabel = (
    stock: number
  ): { label: string; color: string } => {
    if (stock === 0) return { label: "Out of Stock", color: "#ef4444" };
    if (stock <= 3) return { label: "Critical", color: "#f97316" };
    return { label: "Low Stock", color: "#f59e0b" };
  };

  const cardStyle = (color: string): React.CSSProperties => ({
    background: "#fff",
    border: "1px solid #ccc",
    borderTop: `4px solid ${color}`,
    borderRadius: "6px",
    padding: "20px",
    flex: "1 1 180px",
    minWidth: "180px",
  });

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

  const chartBox: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "20px",
    flex: "1 1 340px",
    minWidth: "300px",
  };

  const emptyChart: React.CSSProperties = {
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    fontSize: "13px",
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "sans-serif" }}>
        <h1 style={{ marginBottom: "4px" }}>📊 Dashboard</h1>
        <p style={{ color: "#999", fontSize: "13px" }}>Loading dashboard...</p>
      </div>
    );
  }

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
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Total Products</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#111" }}>{products.length}</div>
        </div>
        <div style={cardStyle("#22c55e")}>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Total Customers</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#111" }}>{customers.length}</div>
        </div>
        <div style={cardStyle("#f59e0b")}>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Total Orders</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#111" }}>{orders.length}</div>
        </div>
        <div style={cardStyle("#8b5cf6")}>
          <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Total Revenue (AUD)</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#111" }}>
            ${totalRevenue.toLocaleString("en-AU", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
          >
            + Add Product
          </button>
          <button
            onClick={() => { addActivity("Quick action: Add Customer clicked"); window.location.href = "/customers"; }}
            style={{ padding: "10px 20px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: 600 }}
          >
            + Add Customer
          </button>
          <button
            onClick={() => { addActivity("Quick action: Create Order clicked"); window.location.href = "/orders"; }}
            style={{ padding: "10px 20px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: 600 }}
          >
            + Create Order
          </button>
        </div>
      </div>

      {/* Charts */}
      <h2 style={sectionTitle}>📈 Analytics</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
        <div style={chartBox}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", marginTop: 0, color: "#333" }}>
            Revenue per Order (Last 10)
          </h3>
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

        <div style={chartBox}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", marginTop: 0, color: "#333" }}>
            Units Ordered per Product
          </h3>
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "32px" }}>
        <div style={chartBox}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", marginTop: 0, color: "#333" }}>
            Products by Category
          </h3>
          {categoryPieData.length === 0 ? (
            <div style={emptyChart}>No product data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        <div style={chartBox}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", marginTop: 0, color: "#333" }}>
            Orders by Status
          </h3>
          {statusPieData.length === 0 ? (
            <div style={emptyChart}>No order data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                    <tr key={String(order.id)}>
                      <td style={cellStyle}>{String(order.id).slice(0, 8)}…</td>
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
          <p style={{ color: "#22c55e", fontWeight: 600 }}>
            ✅ All products are sufficiently stocked.
          </p>
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
                    <tr key={String(product.id)}>
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