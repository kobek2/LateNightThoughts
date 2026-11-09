"use client";

import { useEffect, useState, useTransition } from "react";
import { setStance } from "@/lib/actions";
import type { Stance } from "@/lib/types";

export function StanceControl({
  takeId,
  text,
  agree: initialAgree,
  disagree: initialDisagree,
  stance: initialStance,
  compact = false,
}: {
  takeId: string;
  text: string;
  agree: number;
  disagree: number;
  stance: Stance | null;
  compact?: boolean;
}) {
  const [agree, setAgree] = useState(initialAgree);
  const [disagree, setDisagree] = useState(initialDisagree);
  const [stance, setCurrent] = useState<Stance | null>(initialStance);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAgree(initialAgree);
    setDisagree(initialDisagree);
    setCurrent(initialStance);
  }, [initialAgree, initialDisagree, initialStance, takeId]);

  function vote(next: Stance) {
    const previous = { agree, disagree, stance };
    let nextAgree = agree;
    let nextDisagree = disagree;
    let nextStance: Stance | null = next;
    if (stance === "agree") nextAgree -= 1;
    if (stance === "disagree") nextDisagree -= 1;
    if (stance === next) {
      nextStance = null;
    } else if (next === "agree") {
      nextAgree += 1;
    } else {
      nextDisagree += 1;
    }
    setAgree(nextAgree);
    setDisagree(nextDisagree);
    setCurrent(nextStance);
    setError(null);
    startTransition(async () => {
      const result = await setStance(takeId, next);
      if ("error" in result) {
        setAgree(previous.agree);
        setDisagree(previous.disagree);
        setCurrent(previous.stance);
        setError(result.error);
        return;
      }
      setAgree(result.agree);
      setDisagree(result.disagree);
      setCurrent(result.stance);
    });
  }

  const total = agree + disagree;

  return (
    <div className={compact ? "stance stance-compact" : "stance"}>
      {!compact && (
        <>
          <p className="kicker">Take</p>
          <p className="take-text">{text}</p>
          <div className="split" aria-hidden="true">
            {total === 0 ? (
              <span className="split-agree" style={{ width: "100%", background: "var(--line)" }} />
            ) : (
              <>
                <span className="split-agree" style={{ width: `${(agree / total) * 100}%` }} />
                <span className="split-disagree" style={{ width: `${(disagree / total) * 100}%` }} />
              </>
            )}
          </div>
        </>
      )}
      <div className="vote-row">
        <button
          type="button"
          className="vote"
          data-stance="agree"
          aria-pressed={stance === "agree"}
          disabled={pending}
          onClick={() => vote("agree")}
        >
          Agree · {agree}
        </button>
        <button
          type="button"
          className="vote"
          data-stance="disagree"
          aria-pressed={stance === "disagree"}
          disabled={pending}
          onClick={() => vote("disagree")}
        >
          Disagree · {disagree}
        </button>
      </div>
      {!compact && (
        <p className="stance-note">
          {stance === "agree" && "You agree. Select it again to clear your stance."}
          {stance === "disagree" && "You disagree. Select it again to clear your stance."}
          {stance === null && "One stance per reader, saved in this browser. You can change it."}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
