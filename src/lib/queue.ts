import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

export const transcriptionQueue = new Queue("transcription", { connection });
export const summarizationQueue = new Queue("summarization", { connection });
export const actionItemsQueue = new Queue("action-items", { connection });
export const sentimentQueue = new Queue("sentiment", { connection });
export const notificationQueue = new Queue("notifications", { connection });

export async function addTranscriptionJob(data: {
  meetingId: string;
  recordingId: string;
  organizationId: string;
  audioUrl: string;
}) {
  return transcriptionQueue.add("transcribe", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function addSummarizationJob(data: {
  meetingId: string;
  transcriptId: string;
  organizationId: string;
}) {
  return summarizationQueue.add("summarize", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function addActionItemsJob(data: {
  meetingId: string;
  transcriptId: string;
  organizationId: string;
}) {
  return actionItemsQueue.add("extract", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function addSentimentJob(data: {
  transcriptId: string;
  organizationId: string;
}) {
  return sentimentQueue.add("analyze", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function addNotificationJob(data: {
  type: string;
  userId: string;
  organizationId: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}) {
  return notificationQueue.add("send", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  });
}
