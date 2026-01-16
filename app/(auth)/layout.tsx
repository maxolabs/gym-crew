import type React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-3 py-10">
      <div className="w-full">{children}</div>
    </div>
  );
}


