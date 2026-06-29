import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { transcribeAudio } from "@/lib/ai/openai";
import { addSummarizationJob, addActionItemsJob, addSentimentJob } from "@/lib/queue";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

interface TranscriptionJobData {
  meetingId: string;
  recordingId: string;
  organizationId: string;
  audioUrl: string;
}

async function processTranscription(job: Job<TranscriptionJobData>) {
  const { meetingId, recordingId, organizationId, audioUrl } = job.data;

  console.log(`Processing transcription for meeting ${meetingId}`);

  const transcript = await prisma.transcript.create({
    data: {
      organizationId,
      meetingId,
      status: "PROCESSING",
    },
  });

  try {
    const result = await transcribeAudio(audioUrl);

    const segments = await Promise.all(
      result.segments.map((seg, index) =>
        prisma.transcriptSegment.create({
          data: {
            transcriptId: transcript.id,
            speakerLabel: seg.speaker || `Speaker ${(index % 4) + 1}`,
            startTime: seg.start,
            endTime: seg.end,
            text: seg.text,
          },
        })
      )
    );

    await prisma.transcript.update({
      where: { id: transcript.id },
      data: {
        status: "COMPLETED",
        fullText: result.text,
        wordCount: result.text.split(/\s+/).length,
      },
    });

    await prisma.recording.update({
      where: { id: recordingId },
      data: { status: "READY" },
    });

    await addSummarizationJob({
      meetingId,
      transcriptId: transcript.id,
      organizationId,
    });

    await addActionItemsJob({
      meetingId,
      transcriptId: transcript.id,
      organizationId,
    });

    await addSentimentJob({
      transcriptId: transcript.id,
      organizationId,
    });

    console.log(`Transcription completed for meeting ${meetingId}`);
    return { transcriptId: transcript.id, segmentCount: segments.length };
  } catch (error) {
    console.error(`Transcription failed for meeting ${meetingId}:`, error);

    await prisma.transcript.update({
      where: { id: transcript.id },
      data: { status: "FAILED" },
    });

    throw error;
  }
}

export const transcriptionWorker = new Worker(
  "transcription",
  processTranscription,
  {
    connection,
    concurrency: 2,
  }
);

transcriptionWorker.on("completed", (job) => {
  console.log(`Transcription job ${job.id} completed`);
});

transcriptionWorker.on("failed", (job, err) => {
  console.error(`Transcription job ${job?.id} failed:`, err);
});
