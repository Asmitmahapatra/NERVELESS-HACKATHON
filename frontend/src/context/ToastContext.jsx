import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast = {
      id,
      title: payload?.title || "Notice",
      description: payload?.description || "",
      variant: payload?.variant || "info",
      duration: payload?.duration || 3200,
    };

    setToasts((prev) => [...prev, toast]);
    setTimeout(() => removeToast(id), toast.duration);
  }, [removeToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: "fixed", right: 16, bottom: 16, display: "grid", gap: 10, zIndex: 40 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="card"
            style={{
              minWidth: 260,
              borderColor:
                toast.variant === "success"
                  ? "rgba(16,215,181,0.45)"
                  : toast.variant === "error"
                    ? "rgba(255,107,125,0.45)"
                    : "rgba(124,140,255,0.45)",
            }}
          >
            <strong>{toast.title}</strong>
            {toast.description ? <div className="muted" style={{ marginTop: 4 }}>{toast.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
