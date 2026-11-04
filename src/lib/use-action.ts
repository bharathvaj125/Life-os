"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResult } from "./client-api";

/** Tracks pending and error state for a client-side call, and refreshes server data after success. */
export function useAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(call: () => Promise<ApiResult<T>>, onSuccess?: (data: T) => void): Promise<boolean> {
    setPending(true);
    setError(null);
    const result = await call();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    if (onSuccess) onSuccess(result.data);
    else router.refresh();
    return true;
  }

  return { pending, error, run, router };
}
