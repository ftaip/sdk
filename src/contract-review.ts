import type { AiParalegalClient } from "./client";
import type {
  ContractReviewResponse,
  ContractReviewResult,
  ContractReviewStreamCallbacks,
} from "./types";
import { consumeSseStream } from "./sse";

export interface ContractReviewOptions {
  contractType?: string;
  ourPartyName?: string;
  jurisdiction?: string;
  playbook?: string;
  instructions?: string;
}

export async function reviewContract(
  client: AiParalegalClient,
  sessionToken: string,
  file: File,
  opts?: ContractReviewOptions,
): Promise<ContractReviewResponse> {
  const formData = new FormData();
  formData.append("contract", file);

  if (opts?.contractType) formData.append("contract_type", opts.contractType);
  if (opts?.ourPartyName) formData.append("our_party_name", opts.ourPartyName);
  if (opts?.jurisdiction) formData.append("jurisdiction", opts.jurisdiction);
  if (opts?.playbook) formData.append("playbook", opts.playbook);
  if (opts?.instructions) formData.append("instructions", opts.instructions);

  const response = await fetch(
    client.url("/api/sdk/v1/contract/review"),
    {
      method: "POST",
      headers: client.multipartSessionHeaders(sessionToken),
      body: formData,
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Contract review failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<ContractReviewResponse>;
}

export async function streamContractReview(
  client: AiParalegalClient,
  sessionToken: string,
  file: File,
  opts?: ContractReviewOptions,
  callbacks?: ContractReviewStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const formData = new FormData();
  formData.append("contract", file);

  if (opts?.contractType) formData.append("contract_type", opts.contractType);
  if (opts?.ourPartyName) formData.append("our_party_name", opts.ourPartyName);
  if (opts?.jurisdiction) formData.append("jurisdiction", opts.jurisdiction);
  if (opts?.playbook) formData.append("playbook", opts.playbook);
  if (opts?.instructions) formData.append("instructions", opts.instructions);

  const response = await fetch(
    client.url("/api/sdk/v1/contract/review/stream"),
    {
      method: "POST",
      headers: {
        ...client.multipartSessionHeaders(sessionToken),
        Accept: "text/event-stream",
      },
      body: formData,
      signal,
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Contract review stream failed with status ${response.status}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = (await response.json()) as ContractReviewResponse;
    callbacks?.onStage?.("complete", "Review complete");
    callbacks?.onComplete?.(json.data);
    return;
  }

  await consumeSseStream(
    response,
    (event, data) => {
      const payload = data as Record<string, unknown>;

      if (event === "stage") {
        const stageStr = (payload.stage as string) ?? "";
        const msg = (payload.message as string) ?? "";
        callbacks?.onStage?.(stageStr as import("./types").ContractReviewStage, msg);
      } else if (event === "complete") {
        callbacks?.onComplete?.(payload as unknown as ContractReviewResult);
      } else if (event === "error") {
        callbacks?.onError?.(
          new Error((payload.message as string) ?? "Contract review failed"),
        );
      }
    },
    signal,
  );
}
