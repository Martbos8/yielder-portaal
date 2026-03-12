"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { MaterialIcon } from "./icon";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_CONFIG: Record<Toast["type"], { icon: string; color: string }> = {
  success: { icon: "check_circle", color: "text-emerald-500" },
  error: { icon: "error", color: "text-rose-500" },
  info: { icon: "info", color: "text-blue-500" },
  warning: { icon: "warning", color: "text-amber-500" },
};

/** Toast notification provider. Wrap your app with this to use useToast(). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      // Remove from DOM after exit animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Meldingen"
      >
        {toasts.map((toast) => {
          const config = TYPE_CONFIG[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 bg-white rounded-xl shadow-card-hover border border-border px-4 py-3 min-w-[280px] max-w-[400px] ${
                toast.exiting ? "toast-exit" : "toast-enter"
              }`}
              role="alert"
            >
              <MaterialIcon name={config.icon} size={20} className={config.color} />
              <p className="text-sm text-foreground flex-1">{toast.message}</p>
              <button
                onClick={() => {
                  setToasts((prev) =>
                    prev.map((t) => (t.id === toast.id ? { ...t, exiting: true } : t))
                  );
                  setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }, 200);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Sluiten"
              >
                <MaterialIcon name="close" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook to show toast notifications. Must be used within ToastProvider. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
