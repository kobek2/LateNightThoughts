"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteComment } from "@/lib/actions";

export function RemoveCommentButton({ id }: { id: string }) {
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
          if (!confirm("Remove this comment?")) return;
          setPending(true);
          setError(null);
          const result = await deleteComment(id);
          if ("error" in result) {
            setError(result.error);
            setPending(false);
            return;
          }
          router.refresh();
          setPending(false);
        }}
      >
        {pending ? "Removing…" : "Remove"}
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
