"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type React from "react";

type ToastItem = { id: string; type: "success" | "error" | "info"; message: string };

type ToastCtx = {
  push: (t: Omit<ToastItem, "id">) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used within <ToastProvider />");
  return v;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((p) => [...p, { id, ...t }]);
    window.setTimeout(() => {
      setItems((p) => p.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed left-0 right-0 top-3 z-50 flex items-center justify-center px-3">
        <div className="flex w-full max-w-sm flex-col gap-2">
          {items.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-2xl border border-white/10 bg-card px-4 py-3 shadow-soft",
                t.type === "success" && "border-accent/30",
                t.type === "error" && "border-danger/30"
              )}
              role="status"
            >
              <p className="text-sm">{t.message}</p>
            </div>
          ))}
        </div>
      </div>
    </Ctx.Provider>
  );
}


