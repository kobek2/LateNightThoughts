"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { lockStudio, unlockStudio } from "@/lib/actions";

export function WriteGate() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await unlockStudio(draft);
    setPending(false);
    if (!result.ok) {
      setError("That passphrase does not match.");
      return;
    }
    setDraft("");
    router.refresh();
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
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className="text-button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await lockStudio();
        router.refresh();
      }}
    >
      Lock
    </button>
  );
}
