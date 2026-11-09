"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/actions";
import { OPEN_DRAFT_KEY, SESSION_DRAFT_KEY, draftStorageKey } from "@/lib/constants";

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <span>
      <button
        type="button"
        className="text-button danger"
        disabled={pending}
        onClick={async () => {
          if (!confirm("Delete this post and its comments?")) return;
          setPending(true);
          setError(null);
          const result = await deletePost(id);
          if ("error" in result) {
            setError(result.error);
            setPending(false);
            return;
          }
          localStorage.removeItem(draftStorageKey(id));
          if (localStorage.getItem(OPEN_DRAFT_KEY) === id) localStorage.removeItem(OPEN_DRAFT_KEY);
          if (sessionStorage.getItem(SESSION_DRAFT_KEY) === id) sessionStorage.removeItem(SESSION_DRAFT_KEY);
          router.push("/write");
          router.refresh();
        }}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span className="form-error" role="alert">
          {" "}
          {error}
        </span>
      )}
    </span>
  );
}
