import { Link } from "react-router-dom";
import Header from "../components/Header";

type MainLayoutProps = {
  children: React.ReactNode;
};

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f5f5f5",
      }}
    >
      <aside
        style={{
          width: "250px",
          background: "#1e293b",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>DigitalHub</h2>

        <p><Link to="/" style={{ color: "white", textDecoration: "none" }}>🏠 Dashboard</Link></p>

        <p><Link to="/products" style={{ color: "white", textDecoration: "none" }}>📦 Products</Link></p>

        <p><Link to="/categories" style={{ color: "white", textDecoration: "none" }}>🗂️ Categories</Link></p>

        <p><Link to="/customers" style={{ color: "white", textDecoration: "none" }}>👥 Customers</Link></p>

        <p><Link to="/orders" style={{ color: "white", textDecoration: "none" }}>🛒 Orders</Link></p>

        <p><Link to="/suppliers" style={{ color: "white", textDecoration: "none" }}>🚚 Suppliers</Link></p>

        <p><Link to="/inventory" style={{ color: "white", textDecoration: "none" }}>📊 Inventory</Link></p>

        <p><Link to="/reports" style={{ color: "white", textDecoration: "none" }}>📈 Reports</Link></p>

        <p><Link to="/settings" style={{ color: "white", textDecoration: "none" }}>⚙️ Settings</Link></p>

        <p><Link to="/profile" style={{ color: "white", textDecoration: "none" }}>👤 Profile</Link></p>

        <p><Link to="/login" style={{ color: "white", textDecoration: "none" }}>🔐 Login</Link></p>
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <main
          style={{
            flex: 1,
            padding: "30px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;