import { useState, useEffect } from "react";

const DEMO_EMAIL = "admin@digitalhub.com";
const DEMO_PASSWORD = "admin123";
const SESSION_KEY = "digitalhub_session";
const REMEMBER_KEY = "digitalhub_remember";
const PROFILE_KEY = "digitalhub_profile";

interface LoginSession {
  email: string;
  loggedIn: boolean;
  loginTime: string;
}

interface StoredProfile {
  lastLogin?: string;
  [key: string]: unknown;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email if remembered
    try {
      const remembered = localStorage.getItem(REMEMBER_KEY);
      if (remembered) setEmail(remembered);
    } catch {}

    // Redirect if already logged in
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LoginSession;
        if (parsed.loggedIn) {
          window.location.href = "/";
        }
      }
    } catch {}
  }, []);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = () => {
    setLoginError("");
    setLoginSuccess(false);
    if (!validate()) return;

    setLoading(true);

    setTimeout(() => {
      if (
        email.trim().toLowerCase() === DEMO_EMAIL &&
        password === DEMO_PASSWORD
      ) {
        const loginTime = new Date().toLocaleString("en-AU");
        const session: LoginSession = {
          email: email.trim(),
          loggedIn: true,
          loginTime,
        };

        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));

          if (rememberMe) {
            localStorage.setItem(REMEMBER_KEY, email.trim());
          } else {
            localStorage.removeItem(REMEMBER_KEY);
          }

          // Update last login in profile
          const profileRaw = localStorage.getItem(PROFILE_KEY);
          if (profileRaw) {
            const profile = JSON.parse(profileRaw) as StoredProfile;
            profile.lastLogin = loginTime;
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
          }
        } catch {}

        setLoginSuccess(true);
        setLoading(false);
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setLoginError("Invalid email or password. Please try again.");
        setLoading(false);
      }
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  // --- Styles ---
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    fontFamily: "sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "36px 32px",
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box",
  };

  const fieldGroup: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "16px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#333",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    boxSizing: "border-box",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    outline: "none",
  };

  const inputError: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    boxSizing: "border-box",
    fontSize: "14px",
    border: "1px solid red",
    borderRadius: "4px",
    outline: "none",
    background: "#fff5f5",
  };

  const errorStyle: React.CSSProperties = {
    color: "red",
    fontSize: "12px",
    marginTop: "2px",
  };

  const alertError: React.CSSProperties = {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: "4px",
    fontSize: "13px",
    marginBottom: "16px",
    textAlign: "center",
  };

  const alertSuccess: React.CSSProperties = {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    color: "#16a34a",
    padding: "10px 14px",
    borderRadius: "4px",
    fontSize: "13px",
    marginBottom: "16px",
    textAlign: "center",
    fontWeight: 600,
  };

  const passwordWrapper: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const toggleBtn: React.CSSProperties = {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    color: "#3b82f6",
    padding: 0,
    fontWeight: 600,
  };

  const rememberRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
    fontSize: "13px",
    color: "#333",
    cursor: "pointer",
  };

  const loginBtn: React.CSSProperties = {
    width: "100%",
    padding: "11px",
    background: loading ? "#93c5fd" : "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    marginBottom: "16px",
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid #eee",
    marginTop: "20px",
    paddingTop: "16px",
    textAlign: "center",
  };

  const hintStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#999",
    marginTop: "4px",
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "36px", marginBottom: "6px" }}>🛒</div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#111",
              margin: 0,
            }}
          >
            DigitalHub Admin
          </h1>
          <p style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
            Sign in to your account
          </p>
        </div>

        {/* Error Alert */}
        {loginError && <div style={alertError}>⚠️ {loginError}</div>}

        {/* Success Alert */}
        {loginSuccess && (
          <div style={alertSuccess}>✅ Login successful! Redirecting…</div>
        )}

        {/* Email */}
        <div style={fieldGroup}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="admin@digitalhub.com"
            style={errors.email ? inputError : inputStyle}
            autoComplete="email"
          />
          {errors.email && <div style={errorStyle}>{errors.email}</div>}
        </div>

        {/* Password */}
        <div style={fieldGroup}>
          <label style={labelStyle}>Password</label>
          <div style={passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your password"
              style={{
                ...(errors.password ? inputError : inputStyle),
                paddingRight: "60px",
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={toggleBtn}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <div style={errorStyle}>{errors.password}</div>
          )}
        </div>

        {/* Remember Me */}
        <label style={rememberRow}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          Remember me
        </label>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading || loginSuccess}
          style={loginBtn}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        {/* Demo Hint */}
        <div style={dividerStyle}>
          <div style={hintStyle}>Demo credentials</div>
          <div style={{ ...hintStyle, marginTop: "4px" }}>
            Email: <strong>admin@digitalhub.com</strong>
          </div>
          <div style={hintStyle}>
            Password: <strong>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}