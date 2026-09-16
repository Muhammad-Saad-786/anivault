import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function AlertDialog({ open, title, message, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-message"
        className="w-full max-w-sm rounded-card border border-border-dark bg-surface-card p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-completed" />
          <div className="min-w-0 flex-1">
            <h2
              id="alert-dialog-title"
              className="text-lg font-bold text-white"
            >
              {title}
            </h2>
            <p
              id="alert-dialog-message"
              className="mt-2 text-sm leading-6 text-text-secondary"
            >
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert"
            className="-mr-1 -mt-1 rounded-md p-1 text-text-secondary transition hover:bg-surface-elevated hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-brand mt-5 w-full"
        >
          OK
        </button>
      </div>
    </div>
  );
}
