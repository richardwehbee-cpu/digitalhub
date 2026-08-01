import { useState, useEffect } from "react";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  username: string;
  role: string;
  lastLogin: string;
  accountStatus: "Active" | "Inactive";
}

const STORAGE_KEY = "digitalhub_profile";

const DEFAULT_PROFILE: ProfileData = {
  fullName: "Admin User",
  email: "admin@rwglobaldigital.com.au",
  phone: "+61 2 0000 0000",
  position: "Store Administrator",
  username: "admin",
  role: "Super Admin",
  lastLogin: new Date().toLocaleString("en-AU"),
  accountStatus: "Active",
};

function loadProfile(): ProfileData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ProfileData>;
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    }
  } catch {}
  return DEFAULT_PROFILE;
}

function persistProfile(data: ProfileData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function Profile() {
  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSaved, setProfileSaved] = useState(false);

  // Account info (read-only)
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [accountStatus, setAccountStatus] = useState<"Active" | "Inactive">(
    "Active"
  );

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    const data = loadProfile();
    setFullName(data.fullName);
    setEmail(data.email);
    setPhone(data.phone);
    setPosition(data.position);
    setUsername(data.username);
    setRole(data.role);
    setLastLogin(data.lastLogin);
    setAccountStatus(data.accountStatus);
  }, []);

  const validateProfile = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Full name is required.";
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
    if (!position.trim()) next.position = "Position is required.";
    setProfileErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleProfileSave = () => {
    if (!validateProfile()) return;
    const updated: ProfileData = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: position.trim(),
      username,
      role,
      lastLogin,
      accountStatus,
    };
    persistProfile(updated);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleProfileCancel = () => {
    const data = loadProfile();
    setFullName(data.fullName);
    setEmail(data.email);
    setPhone(data.phone);
    setPosition(data.position);
    setProfileErrors({});
    setProfileSaved(false);
  };

  const validatePassword = (): boolean => {
    const next: Record<string, string> = {};
    if (!currentPassword)
      next.currentPassword = "Current password is required.";
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
    setPasswordErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePasswordSave = () => {
    if (!validatePassword()) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handlePasswordCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
    setPasswordSaved(false);
  };

  const initials =
    fullName
      .trim()
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "A";

  // --- Styles ---
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

  const readonlyStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    fontSize: "13px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#f5f5f5",
    color: "#555",
    cursor: "not-allowed",
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

  const avatarStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    color: "#fff",
    fontWeight: 700,
    flexShrink: 0,
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "4px" }}>👤 Profile</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: "24px" }}>
        Manage your personal information and account settings.
      </p>
      <hr style={{ marginBottom: "24px" }} />

      {/* Profile Information */}
      <div style={sectionBox}>
        <h2 style={sectionTitle}>🪪 Profile Information</h2>

        {/* Avatar row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={avatarStyle}>{initials}</div>
            <div
              style={{
                fontSize: "11px",
                color: "#999",
                textAlign: "center",
                marginTop: "4px",
              }}
            >
              Photo placeholder
            </div>
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#111" }}>
              {fullName || "Admin User"}
            </div>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
              {position || "Position"}
            </div>
            <div
              style={{ fontSize: "13px", color: "#3b82f6", marginTop: "2px" }}
            >
              {email || "email@example.com"}
            </div>
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              style={profileErrors.fullName ? inputError : inputStyle}
            />
            {profileErrors.fullName && (
              <div style={errorStyle}>{profileErrors.fullName}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              style={profileErrors.email ? inputError : inputStyle}
            />
            {profileErrors.email && (
              <div style={errorStyle}>{profileErrors.email}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 2 0000 0000"
              style={profileErrors.phone ? inputError : inputStyle}
            />
            {profileErrors.phone && (
              <div style={errorStyle}>{profileErrors.phone}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Store Administrator"
              style={profileErrors.position ? inputError : inputStyle}
            />
            {profileErrors.position && (
              <div style={errorStyle}>{profileErrors.position}</div>
            )}
          </div>
        </div>

        <div style={buttonRow}>
          <button
            onClick={handleProfileSave}
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
            Save Profile
          </button>
          <button
            onClick={handleProfileCancel}
            style={{ padding: "8px 20px", cursor: "pointer" }}
          >
            Cancel
          </button>
          {profileSaved && (
            <span style={successMsg}>✅ Profile saved successfully.</span>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div style={sectionBox}>
        <h2 style={sectionTitle}>🔖 Account Information</h2>

        <div style={fieldRow}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              readOnly
              style={readonlyStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Role</label>
            <input
              type="text"
              value={role}
              readOnly
              style={readonlyStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Last Login</label>
            <input
              type="text"
              value={lastLogin}
              readOnly
              style={readonlyStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Account Status</label>
            <input
              type="text"
              value={accountStatus}
              readOnly
              style={{
                ...readonlyStyle,
                color: accountStatus === "Active" ? "#22c55e" : "#ef4444",
                fontWeight: 600,
              }}
            />
          </div>
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "#999",
            marginTop: "12px",
            marginBottom: 0,
          }}
        >
          ℹ️ Username, role, last login and account status are managed by the
          system and cannot be edited here.
        </p>
      </div>

      {/* Change Password */}
      <div style={sectionBox}>
        <h2 style={sectionTitle}>🔒 Change Password</h2>

        <div style={fieldRow}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              style={passwordErrors.currentPassword ? inputError : inputStyle}
            />
            {passwordErrors.currentPassword && (
              <div style={errorStyle}>{passwordErrors.currentPassword}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              style={passwordErrors.newPassword ? inputError : inputStyle}
            />
            {passwordErrors.newPassword && (
              <div style={errorStyle}>{passwordErrors.newPassword}</div>
            )}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={passwordErrors.confirmPassword ? inputError : inputStyle}
            />
            {passwordErrors.confirmPassword && (
              <div style={errorStyle}>{passwordErrors.confirmPassword}</div>
            )}
          </div>
        </div>

        <div style={buttonRow}>
          <button
            onClick={handlePasswordSave}
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
            onClick={handlePasswordCancel}
            style={{ padding: "8px 20px", cursor: "pointer" }}
          >
            Cancel
          </button>
          {passwordSaved && (
            <span style={successMsg}>✅ Password updated successfully.</span>
          )}
        </div>
      </div>
    </div>
  );
}