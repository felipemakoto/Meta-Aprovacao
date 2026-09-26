import { toQuizResult, type Answers } from "./result-contract.ts";

export class ResultRequestError extends Error {
  readonly status: number;
  constructor(status: number) { super("result_request_failed"); this.status = status; }
}
export async function requestResult(answers?: Answers) {
  const response = await fetch("/api/quiz/result", {
    method: answers ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    signal: AbortSignal.timeout(15000),
    ...(answers ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) } : {}),
  });
  if (!response.ok) throw new ResultRequestError(response.status);
  return toQuizResult(await response.json());
}
