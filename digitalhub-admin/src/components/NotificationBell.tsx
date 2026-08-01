import { useState, useEffect, useRef } from "react";
import {
  loadNotifications,
  markAllRead,
  markOneRead,
  clearAllNotifications,
} from "../services/notifications";

import type { Notification } from "../services/notifications";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refresh = () => setNotifications(loadNotifications());

  useEffect(() => {
    refresh();
    window.addEventListener("digitalhub_notifications_updated", refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("digitalhub_notifications_updated", refresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeIcon: Record<Notification["type"], string> = {
    order: "🧾",
    customer: "👤",
    low_stock: "⚠️",
    out_of_stock: "🔴",
    info: "ℹ️",
  };

  const typeColor: Record<Notification["type"], string> = {
    order: "#3b82f6",
    customer: "#22c55e",
    low_stock: "#f59e0b",
    out_of_stock: "#ef4444",
    info: "#6b7280",
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "22px",
          position: "relative",
          padding: "4px 8px",
          lineHeight: 1,
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "0px",
              right: "0px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              fontSize: "10px",
              fontWeight: 700,
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "340px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 9999,
            maxHeight: "420px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "14px" }}>
              Notifications{" "}
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: "12px",
                    fontSize: "11px",
                    padding: "1px 7px",
                    fontWeight: 700,
                    marginLeft: "4px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => { markAllRead(); refresh(); }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "11px",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => { clearAllNotifications(); refresh(); }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "11px",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "13px",
                }}
              >
                🎉 No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { markOneRead(n.id); refresh(); }}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    background: n.read ? "#fff" : "#f0f7ff",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>
                    {typeIcon[n.type]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        color: typeColor[n.type],
                        fontWeight: n.read ? 400 : 700,
                        lineHeight: "1.4",
                      }}
                    >
                      {n.message}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                      {n.time}
                    </div>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#3b82f6",
                        flexShrink: 0,
                        marginTop: "5px",
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}