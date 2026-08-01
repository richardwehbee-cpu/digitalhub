import NotificationBell from "./NotificationBell";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header
      style={{
        width: "100%",
        background: "#1e293b",
        color: "#fff",
        padding: "0 24px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {/* Left: hamburger + brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
            title="Toggle menu"
          >
            ☰
          </button>
        )}
        <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "0.3px" }}>
          🛒 DigitalHub Admin
        </span>
      </div>

      {/* Right: bell + admin */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <NotificationBell />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            A
          </div>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>Admin</span>
        </div>
      </div>
    </header>
  );
}