"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { ACCEPT } from "@/lib/loadImage";

interface Props {
  onFile: (file: File) => void;
  onSample: () => void;
  error: string | null;
  compact: boolean;
}

/** Pick, drop or paste a screenshot. Paste works anywhere on the page. */
export function UploadZone({ onFile, onSample, error, compact }: Props) {
  const inputId = useId();
  const errorId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        onFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFile]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`upload${over ? " upload--over" : ""}${compact ? " upload--compact" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      {!compact && (
        <p className="upload__lead">
          Drop a screenshot here, paste one with <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>V</kbd>, or pick a file.
        </p>
      )}
      <div className="upload__actions">
        <label htmlFor={inputId} className="button button--primary">
          {compact ? "Try another screenshot" : "Choose a screenshot"}
        </label>
        <input
          id={inputId}
          ref={input}
          className="visually-hidden"
          type="file"
          accept={ACCEPT}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
        <button type="button" className="button button--quiet" onClick={onSample}>
          Use a sample screen
        </button>
      </div>
      {!compact && <p className="upload__note">Your image stays on this device. Nothing is uploaded.</p>}
      {error && (
        <p id={errorId} className="upload__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
