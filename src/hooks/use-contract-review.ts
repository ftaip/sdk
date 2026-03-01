import { useCallback, useState } from "react";
import { reviewContract, streamContractReview } from "../contract-review";
import type { AiParalegalClient } from "../client";
import type {
  ContractReviewResult,
  ContractReviewStage,
  SessionContext,
  UseContractReviewReturn,
} from "../types";

/**
 * React hook for reviewing a single contract — extract text, identify risks,
 * obligations, missing clauses, and produce recommended actions.
 *
 * Supports both synchronous and streaming modes.
 *
 * ```tsx
 * const { review, stage, result, loading, error, reset } = useContractReview(client, session);
 *
 * await review(file, { contractType: 'vendor', stream: true });
 * // stage transitions: idle → extracting → reviewing → complete
 * ```
 */
export function useContractReview(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseContractReviewReturn {
  const [stage, setStage] = useState<ContractReviewStage>("idle");
  const [result, setResult] = useState<ContractReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setResult(null);
    setLoading(false);
    setError(null);
  }, []);

  const review = useCallback(
    async (
      file: File,
      opts?: {
        contractType?: string;
        ourPartyName?: string;
        jurisdiction?: string;
        playbook?: string;
        instructions?: string;
        stream?: boolean;
      },
    ) => {
      if (!client || !session) {
        setStage("error");
        setError(new Error("Client and session are required"));
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);
      setStage("extracting");

      try {
        if (opts?.stream) {
          await streamContractReview(
            client,
            session.sessionToken,
            file,
            {
              contractType: opts.contractType,
              ourPartyName: opts.ourPartyName,
              jurisdiction: opts.jurisdiction,
              playbook: opts.playbook,
              instructions: opts.instructions,
            },
            {
              onStage: (s, _msg) => {
                if (s === "extracting") setStage("extracting");
                else if (s === "reviewing") setStage("reviewing");
              },
              onComplete: (r) => {
                setResult(r);
                setStage("complete");
                setLoading(false);
              },
              onError: (err) => {
                setError(err);
                setStage("error");
                setLoading(false);
              },
            },
          );
        } else {
          const response = await reviewContract(
            client,
            session.sessionToken,
            file,
            {
              contractType: opts?.contractType,
              ourPartyName: opts?.ourPartyName,
              jurisdiction: opts?.jurisdiction,
              playbook: opts?.playbook,
              instructions: opts?.instructions,
            },
          );
          setResult(response.data);
          setStage("complete");
          setLoading(false);
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setStage("error");
        setLoading(false);
      }
    },
    [client, session],
  );

  return { review, stage, result, loading, error, reset };
}
