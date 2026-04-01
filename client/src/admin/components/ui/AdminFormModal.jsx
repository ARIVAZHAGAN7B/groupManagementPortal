import { useEffect } from "react";

export default function AdminFormModal({
  busy = false,
  children,
  onClose,
  open
}) {
  useEffect(() => {
    if (!open || busy) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/40 p-4 py-6 md:py-10">
      <button
        type="button"
        aria-label="Close form dialog"
        onClick={busy ? undefined : onClose}
        className="absolute inset-0"
      />

      <div className="relative max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
