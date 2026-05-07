import { v4 as uuidv4 } from "uuid";
import type { Response } from "express";

export type WorkflowOutputs = Record<string, unknown>;

type Usage = {
  elapsedTime?: number;
  totalTokens?: number;
};

export function createRunIds(workflowName = "workflow") {
  const suffix = uuidv4();
  return {
    workflowRunId: `run_${suffix}`,
    taskId: `task_${suffix}`,
    workflowId: workflowName,
  };
}

export function workflowResponse(workflowName: string, outputs: WorkflowOutputs, usage: Usage = {}) {
  const now = Math.floor(Date.now() / 1000);
  const ids = createRunIds(workflowName);

  return {
    workflow_run_id: ids.workflowRunId,
    task_id: ids.taskId,
    data: {
      id: ids.workflowRunId,
      workflow_id: ids.workflowId,
      status: "succeeded",
      outputs,
      error: "",
      elapsed_time: usage.elapsedTime ?? 0,
      total_tokens: usage.totalTokens ?? 0,
      total_steps: 1,
      created_at: now,
      finished_at: now,
    },
  };
}

export function streamEvent(res: Response, event: string, data: unknown) {
  res.write(`data: ${JSON.stringify({ event, data })}\n\n`);
}

export function streamStarted(res: Response, workflowName: string) {
  const now = Math.floor(Date.now() / 1000);
  streamEvent(res, "workflow_started", {
    id: `run_${uuidv4()}`,
    workflow_id: workflowName,
    created_at: now,
  });
}

export function streamFinished(res: Response, workflowName: string, outputs: WorkflowOutputs, usage: Usage = {}) {
  const now = Math.floor(Date.now() / 1000);
  streamEvent(res, "workflow_finished", {
    id: `run_${uuidv4()}`,
    workflow_id: workflowName,
    outputs,
    status: "succeeded",
    elapsed_time: usage.elapsedTime ?? 0,
    total_tokens: usage.totalTokens ?? 0,
    total_steps: "1",
    created_at: now,
    finished_at: now,
  });
}

export function streamError(res: Response, message: string) {
  streamEvent(res, "error", {
    message,
  });
}
