import { useRef } from "react";
import type { Invoice } from "../services/invoices";

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const handleDownloadPDF = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .text-right { text-align: right; }
            @media print { @page { margin: 1cm; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  const statusColor: Record<Invoice["status"], string> = {
    Paid: "#22c55e",
    Pending: "#f59e0b",
    Overdue: "#ef4444",
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  };

  const modalStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "740px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    padding: "16px 24px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    background: "#f9fafb",
  };

  const bodyStyle: React.CSSProperties = {
    overflowY: "auto",
    flex: 1,
    padding: "24px",
  };

  const footerStyle: React.CSSProperties = {
    padding: "14px 24px",
    borderTop: "1px solid #eee",
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    flexShrink: 0,
    background: "#f9fafb",
    flexWrap: "wrap",
  };

  const cell: React.CSSProperties = { border: "1px solid #ccc", padding: "9px 12px" };
  const th: React.CSSProperties = { ...cell, background: "#f5f5f5", fontWeight: 600, fontSize: "12px" };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        {/* Modal Header */}
        <div style={headerStyle}>
          <span style={{ fontWeight: 700, fontSize: "15px" }}>
            Invoice — {invoice.invoiceNumber}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Invoice Body */}
        <div style={bodyStyle}>
          <div ref={printRef}>

            {/* Brand Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>
                  🛒 DigitalHub
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  RW Global Digital Pty Ltd
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  info@rwglobaldigital.com.au
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Sydney, NSW, Australia
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#3b82f6" }}>
                  INVOICE
                </div>
                <div style={{ fontSize: "13px", marginTop: "6px", color: "#333" }}>
                  <strong>Invoice #:</strong> {invoice.invoiceNumber}
                </div>
                <div style={{ fontSize: "13px", color: "#333" }}>
                  <strong>Date:</strong> {invoice.date}
                </div>
                <div style={{ fontSize: "13px", color: "#333" }}>
                  <strong>Due Date:</strong> {invoice.dueDate}
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span style={{
                    background: invoice.status === "Paid" ? "#dcfce7" : invoice.status === "Pending" ? "#fef9c3" : "#fee2e2",
                    color: statusColor[invoice.status],
                    fontWeight: 700,
                    fontSize: "12px",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    border: `1px solid ${statusColor[invoice.status]}`,
                  }}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>
                Bill To
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#111" }}>{invoice.customerName}</div>
              {invoice.customerEmail && <div style={{ fontSize: "13px", color: "#555", marginTop: "2px" }}>{invoice.customerEmail}</div>}
              {invoice.customerPhone && <div style={{ fontSize: "13px", color: "#555" }}>{invoice.customerPhone}</div>}
              {invoice.customerCity && <div style={{ fontSize: "13px", color: "#555" }}>{invoice.customerCity}</div>}
            </div>

            {/* Order Reference */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>
                Order Reference
              </div>
              <div style={{ fontSize: "13px", color: "#333" }}>Order #{invoice.orderId}</div>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr>
                  <th style={th}>Description</th>
                  <th style={{ ...th, textAlign: "center" }}>Qty</th>
                  <th style={{ ...th, textAlign: "right" }}>Unit Price (AUD)</th>
                  <th style={{ ...th, textAlign: "right" }}>Total (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td style={cell}>{item.productName}</td>
                    <td style={{ ...cell, textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ ...cell, textAlign: "right" }}>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ ...cell, textAlign: "right" }}>${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "32px" }}>
              <table style={{ width: "260px", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 12px", color: "#555", fontSize: "13px" }}>Subtotal</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", fontSize: "13px" }}>${invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 12px", color: "#555", fontSize: "13px" }}>GST (10%)</td>
                    <td style={{ padding: "6px 12px", textAlign: "right", fontSize: "13px" }}>${invoice.tax.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: "2px solid #1e293b" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: "15px" }}>Total (AUD)</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: "15px", color: "#3b82f6" }}>
                      ${invoice.total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #eee", paddingTop: "16px", textAlign: "center", fontSize: "12px", color: "#999" }}>
              <div>Thank you for your business with DigitalHub.</div>
              <div style={{ marginTop: "4px" }}>
                Questions? Contact us at info@rwglobaldigital.com.au
              </div>
              <div style={{ marginTop: "4px" }}>
                RW Global Digital Pty Ltd — ABN 36 846 050 231 — Sydney, NSW, Australia
              </div>
            </div>

          </div>
        </div>

        {/* Footer Buttons */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={{ padding: "8px 18px", cursor: "pointer", borderRadius: "5px", border: "1px solid #ccc", background: "#fff", fontSize: "13px" }}
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            style={{ padding: "8px 18px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#1e293b", color: "#fff", fontWeight: 600, fontSize: "13px" }}
          >
            🖨️ Print
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{ padding: "8px 18px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, fontSize: "13px" }}
          >
            ⬇️ Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}