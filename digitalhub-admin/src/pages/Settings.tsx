import { useState, useEffect } from "react";

type Currency = "AUD" | "USD" | "EUR";

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  phone: string;
  currency: Currency;
  timeZone: string;
  address: string;
}

interface AccountSettings {
  adminName: string;
  adminEmail: string;
}

interface SavedSettings {
  store: StoreSettings;
  account: AccountSettings;
}

const STORAGE_KEY = "digitalhub_settings";

const TIME_ZONES: string[] = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Asia/Dubai",
  "Asia/Cairo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

const CURRENCIES: Currency[] = ["AUD", "USD", "EUR"];

const DEFAULT_STORE: StoreSettings = {
  storeName: "RW Global Digital",
  storeEmail: "info@rwglobaldigital.com.au",
  phone: "+61 2 0000 0000",
  currency: "AUD",
  timeZone: "Australia/Sydney",
  address: "Sydney, NSW, Australia",
};

const DEFAULT_ACCOUNT: AccountSettings = {
  adminName: "Admin",
  adminEmail: "admin@rwglobaldigital.com.au",
};

function loadSettings(): SavedSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<SavedSettings>;
      return {
        store: { ...DEFAULT_STORE, ...(parsed.store ?? {}) },
        account: { ...DEFAULT_ACCOUNT, ...(parsed.account ?? {}) },
      };
    }
  } catch {}
  return { store: DEFAULT_STORE, account: DEFAULT_ACCOUNT };
}

function persistSettings(store: StoreSettings, account: AccountSettings): void {
  try {
    const data: SavedSettings = { store, account };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function Settings() {
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState<Currency>("AUD");
  const [timeZone, setTimeZone] = useState("Australia/Sydney");
  const [address, setAddress] = useState("");
  const [storeErrors, setStoreErrors] = useState<Record<string, string>>({});
  const [storeSaved, setStoreSaved] = useState(false);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [accountSaved, setAccountSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [securitySaved, setSecuritySaved] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setStoreName(loaded.store.storeName);
    setStoreEmail(loaded.store.storeEmail);
    setPhone(loaded.store.phone);
    setCurrency(loaded.store.currency);
    setTimeZone(loaded.store.timeZone);
    setAddress(loaded.store.address);
    setAdminName(loaded.account.adminName);
    setAdminEmail(loaded.account.adminEmail);
  }, []);

  const validateStore = (): boolean => {
    const next: Record<string, string> = {};
    if (!storeName.trim()) next.storeName = "Store name is required.";
    if (!storeEmail.trim()) {
      next.storeEmail = "Store email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail.trim())) {
      next.storeEmail = "Enter a valid email address.";
    }
    if (!phone.trim()) {
      next.phone = "Phone is required.";
    } else if (!/^\+?[\d\s\-()]{6,20}$/.test(phone.trim())) {
      next.phone = "Enter a valid phone number.";
    }
    if (!address.trim()) next.address = "Address is required.";
    setStoreErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleStoreSave = () => {
    if (!validateStore()) return;
    const storeData: StoreSettings = {
      storeName: storeName.trim(),
      storeEmail: storeEmail.trim(),
      phone: phone.trim(),
      currency,
      timeZone,
      address: address.trim(),
    };
    const loaded = loadSettings();
    persistSettings(storeData, loaded.account);
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 3000);
  };

  const handleStoreCancel = () => {
    const loaded = loadSettings();
    setStoreName(loaded.store.storeName);
    setStoreEmail(loaded.store.storeEmail);
    setPhone(loaded.store.phone);
    setCurrency(loaded.store.currency);
    setTimeZone(loaded.store.timeZone);
    setAddress(loaded.store.address);
    setStoreErrors({});
    setStoreSaved(false);
  };

  const validateAccount = (): boolean => {
    const next: Record<string, string> = {};
    if (!adminName.trim()) next.adminName = "Admin name is required.";
    if (!adminEmail.trim()) {
      next.adminEmail = "Admin email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      next.adminEmail = "Enter a valid email address.";
    }
    setAccountErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAccountSave = () => {
    if (!validateAccount()) return;
    const accountData: AccountSettings = {
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
    };
    const loaded = loadSettings();
    persistSettings(loaded.store, accountData);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 3000);
  };

  const handleAccountCancel = () => {
    const loaded = loadSettings();
    setAdminName(loaded.account.adminName);
    setAdminEmail(loaded.account.adminEmail);
    setAccountErrors({});
    setAccountSaved(false);
  };

  const validateSecurity = (): boolean => {
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = "Current password is required.";
    if (!newPassword) {
      next.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      next.newPassword = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setSecurityErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSecuritySave = () => {
    if (!validateSecurity()) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityErrors({});
    setSecuritySaved(true);
    setTimeout(() => setSecuritySaved(false), 3000);
  };

  const handleSecurityCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityErrors({});
    setSecuritySaved(false);
  };

  const sectionBox: React.CSSProperties = {
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "20px",
    marginBottom: "28px",
    background: "#fff",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "16px",
    marginTop: 0,
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
  };

  const fieldRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "4px",
  };

  const fieldGroup: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#333",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    fontSize: "13px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  };

  const inputError: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    fontSize: "13px",
    border: "1px solid red",
    borderRadius: "4px",
    background: "#fff5f5",
  };

  const errorStyle: React.CSSProperties = {
    color: "red",
    fontSize: "12px",
    marginTop: "2px",
  };

  const buttonRow: React.CSSProperties = {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  };

  const successMsg: React.CSSProperties = {
    color: "#22c55e",
    fontSize: "13px",
    fontWeight: 600,
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "4px" }}>⚙️ Settings</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: "24px" }}>
        Manage your store, account and security settings.
      </p>
      <hr style={{ marginBottom: "24px" }} />

      {/* Store Settings */}
      <div style={sectionBox}>
        <h2 style={sectionTitle}>🏪 Store Settings</h2>

        <div style={fieldRow}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Store name"
              style={storeErrors.storeName ? inputError : inputStyle}
            />
            {storeErrors.storeName && (
              <div style={errorStyle}>{storeErrors.storeName}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Store Email</label>
            <input
              type="text"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              placeholder="store@example.com"
              style={storeErrors.storeEmail ? inputError : inputStyle}
            />
            {storeErrors.storeEmail && (
              <div style={errorStyle}>{storeErrors.storeEmail}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 2 0000 0000"
              style={storeErrors.phone ? inputError : inputStyle}
            />
            {storeErrors.phone && (
              <div style={errorStyle}>{storeErrors.phone}</div>
            )}
          </div>
        </div>

        <div style={{ ...fieldRow, marginTop: "16px" }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              style={inputStyle}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Time Zone</label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              style={inputStyle}
            >
              {TIME_ZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, State, Country"
              style={storeErrors.address ? inputError : inputStyle}
            />
            {storeErrors.address && (
              <div style={errorStyle}>{storeErrors.address}</div>
            )}
          </div>
        </div>

        <div style={buttonRow}>
          <button
            onClick={handleStoreSave}
            style={{
              padding: "8px 20px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Save Settings
          </button>
          <button
            onClick={handleStoreCancel}
            style={{ padding: "8px 20px", cursor: "pointer" }}
          >
            Cancel
          </button>
          {storeSaved && (
            <span style={successMsg}>✅ Store settings saved.</span>
          )}
        </div>
      </div>

      {/* Account Settings */}
      <div style={sectionBox}>
        <h2 style={sectionTitle}>👤 Account Settings</h2>

        <div style={fieldRow}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Admin Name</label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Admin name"
              style={accountErrors.adminName ? inputError : inputStyle}
            />
            {accountErrors.adminName && (
              <div style={errorStyle}>{accountErrors.adminName}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Admin Email</label>
            <input
              type="text"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              style={accountErrors.adminEmail ? inputError : inputStyle}
            />
            {accountErrors.adminEmail && (
              <div style={errorStyle}>{accountErrors.adminEmail}</div>
            )}
          </div>
        </div>

        <div style={buttonRow}>
          <button
            onClick={handleAccountSave}
            style={{
              padding: "8px 20px",
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Save Settings
          </button>
          <button
            onClick={handleAccountCancel}
            style={{ padding: "8px 20px", cursor: "pointer" }}
          >
            Cancel
          </button>
          {accountSaved && (
            <span style={successMsg}>✅ Account settings saved.</span>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div style={sectionBox}>
        <h2 style={sectionTitle}>🔒 Security Settings</h2>

        <div style={fieldRow}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              style={securityErrors.currentPassword ? inputError : inputStyle}
            />
            {securityErrors.currentPassword && (
              <div style={errorStyle}>{securityErrors.currentPassword}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              style={securityErrors.newPassword ? inputError : inputStyle}
            />
            {securityErrors.newPassword && (
              <div style={errorStyle}>{securityErrors.newPassword}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={securityErrors.confirmPassword ? inputError : inputStyle}
            />
            {securityErrors.confirmPassword && (
              <div style={errorStyle}>{securityErrors.confirmPassword}</div>
            )}
          </div>
        </div>

        <div style={buttonRow}>
          <button
            onClick={handleSecuritySave}
            style={{
              padding: "8px 20px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Update Password
          </button>
          <button
            onClick={handleSecurityCancel}
            style={{ padding: "8px 20px", cursor: "pointer" }}
          >
            Cancel
          </button>
          {securitySaved && (
            <span style={successMsg}>✅ Password updated successfully.</span>
          )}
        </div>
      </div>
    </div>
  );
}