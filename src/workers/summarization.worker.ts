import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { generateSummary } from "@/lib/ai/openai";
import { addNotificationJob } from "@/lib/queue";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

interface SummarizationJobData {
  meetingId: string;
  transcriptId: string;
  organizationId: string;
}

async function processSummarization(job: Job<SummarizationJobData>) {
  const { meetingId, transcriptId, organizationId } = job.data;

  console.log(`Processing summarization for meeting ${meetingId}`);

  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
  });

  if (!transcript?.fullText) {
    throw new Error("Transcript not found or empty");
  }

  try {
    const result = await generateSummary(transcript.fullText);

    const summary = await prisma.summary.create({
      data: {
        organizationId,
        meetingId,
        transcriptId,
        executiveSummary: result.executiveSummary,
        keyPoints: result.keyPoints,
        risks: result.risks,
        decisions: result.decisions,
        nextSteps: result.nextSteps,
        generatedByModel: "gpt-4o",
      },
    });

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { createdById: true, title: true },
    });

    if (meeting) {
      await addNotificationJob({
        type: "meeting.summarized",
        userId: meeting.createdById,
        organizationId,
        title: "Meeting summary ready",
        body: `The summary for "${meeting.title}" is now available.`,
        metadata: { meetingId, summaryId: summary.id },
      });
    }

    console.log(`Summarization completed for meeting ${meetingId}`);
    return { summaryId: summary.id };
  } catch (error) {
    console.error(`Summarization failed for meeting ${meetingId}:`, error);
    throw error;
  }
}

export const summarizationWorker = new Worker(
  "summarization",
  processSummarization,
  {
    connection,
    concurrency: 2,
  }
);

summarizationWorker.on("completed", (job) => {
  console.log(`Summarization job ${job.id} completed`);
});

summarizationWorker.on("failed", (job, err) => {
  console.error(`Summarization job ${job?.id} failed:`, err);
});
