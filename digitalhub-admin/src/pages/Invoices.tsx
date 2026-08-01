import { useState, useEffect } from "react";
import { loadInvoices, type Invoice } from "../services/invoices";
import InvoiceModal from "../components/InvoiceModal";

function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setInvoices(loadInvoices());
  }, []);

  const refresh = () => setInvoices(loadInvoices());

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.status.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<Invoice["status"], string> = {
    Paid: "#22c55e",
    Pending: "#f59e0b",
    Overdue: "#ef4444",
  };

  const totalRevenue = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const cellStyle = { border: "1px solid #ccc", padding: "10px" };

  return (
    <div>
      {viewingInvoice && (
        <InvoiceModal
          invoice={viewingInvoice}
          onClose={() => { setViewingInvoice(null); refresh(); }}
        />
      )}

      <h1>🧾 Invoices</h1>
      <p>All invoices generated from orders.</p>
      <hr />

      {/* Summary */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", margin: "20px 0" }}>
        <div style={{ background: "#fff", border: "1px solid #ccc", borderTop: "4px solid #3b82f6", borderRadius: "6px", padding: "16px 20px", flex: "1 1 160px", minWidth: "160px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Total Invoices</div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>{invoices.length}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ccc", borderTop: "4px solid #22c55e", borderRadius: "6px", padding: "16px 20px", flex: "1 1 160px", minWidth: "160px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Paid</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#22c55e" }}>
            {invoices.filter((i) => i.status === "Paid").length}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ccc", borderTop: "4px solid #f59e0b", borderRadius: "6px", padding: "16px 20px", flex: "1 1 160px", minWidth: "160px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Pending</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#f59e0b" }}>
            {invoices.filter((i) => i.status === "Pending").length}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ccc", borderTop: "4px solid #8b5cf6", borderRadius: "6px", padding: "16px 20px", flex: "1 1 160px", minWidth: "160px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Revenue Collected (AUD)</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#8b5cf6" }}>
            ${totalRevenue.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "260px", padding: "8px" }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
          <thead>
            <tr>
              <th style={cellStyle}>Invoice #</th>
              <th style={cellStyle}>Order ID</th>
              <th style={cellStyle}>Customer</th>
              <th style={cellStyle}>Date</th>
              <th style={cellStyle}>Due Date</th>
              <th style={cellStyle}>Total (AUD)</th>
              <th style={cellStyle}>Status</th>
              <th style={cellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...cellStyle, textAlign: "center", color: "#999" }}>
                  {search ? `No invoices found for "${search}".` : "No invoices yet. Place an order to generate one."}
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.invoiceNumber}>
                  <td style={cellStyle}>{inv.invoiceNumber}</td>
                  <td style={cellStyle}>#{inv.orderId}</td>
                  <td style={cellStyle}>{inv.customerName}</td>
                  <td style={cellStyle}>{inv.date}</td>
                  <td style={cellStyle}>{inv.dueDate}</td>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>${inv.total.toFixed(2)}</td>
                  <td style={cellStyle}>
                    <span style={{ color: statusColor[inv.status], fontWeight: 600, fontSize: "13px" }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={() => setViewingInvoice(inv)}
                      style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "5px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                    >
                      🧾 View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Invoices;