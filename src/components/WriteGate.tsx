"use client";

import { FormEvent, ReactNode, createContext, useContext, useEffect, useState } from "react";
import { checkPassphrase } from "@/lib/actions";
import { PASS_STORAGE_KEY } from "@/lib/constants";

const PassContext = createContext({ pass: "", required: false });

export function usePass() {
  return useContext(PassContext);
}

export function WriteGate({ required, children }: { required: boolean; children: ReactNode }) {
  const [state, setState] = useState<"unknown" | "locked" | "open">(required ? "unknown" : "open");
  const [pass, setPass] = useState("");

  useEffect(() => {
    if (!required) return;
    const saved = sessionStorage.getItem(PASS_STORAGE_KEY) ?? "";
    if (!saved) {
      setState("locked");
      return;
    }
    let cancelled = false;
    checkPassphrase(saved).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setPass(saved);
        setState("open");
      } else {
        sessionStorage.removeItem(PASS_STORAGE_KEY);
        setState("locked");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [required]);

  if (!required) {
    return <PassContext.Provider value={{ pass: "", required: false }}>{children}</PassContext.Provider>;
  }
  if (state === "unknown") {
    return (
      <p className="hint" role="status">
        Opening the studio…
      </p>
    );
  }
  if (state === "locked") {
    return (
      <Gate
        onUnlock={(next) => {
          sessionStorage.setItem(PASS_STORAGE_KEY, next);
          setPass(next);
          setState("open");
        }}
      />
    );
  }
  return <PassContext.Provider value={{ pass, required: true }}>{children}</PassContext.Provider>;
}

function Gate({ onUnlock }: { onUnlock: (pass: string) => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await checkPassphrase(draft);
    setPending(false);
    if (!result.ok) {
      setError("That passphrase does not match.");
      return;
    }
    onUnlock(draft);
  }

  return (
    <form className="measure" onSubmit={onSubmit}>
      <p className="kicker">Studio</p>
      <h1 className="page-title">The studio is locked.</h1>
      <p className="deck">Enter the passphrase to write, edit, or remove a post.</p>
      <label className="field">
        <span>Passphrase</span>
        <input
          className="line-input"
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}

export function LockButton() {
  const { required } = usePass();
  if (!required) return null;
  return (
    <button
      type="button"
      className="text-button"
      onClick={() => {
        sessionStorage.removeItem(PASS_STORAGE_KEY);
        window.location.reload();
      }}
    >
      Lock
    </button>
  );
}
