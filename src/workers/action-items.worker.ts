import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { extractActionItems } from "@/lib/ai/openai";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

interface Member {
  userId: string;
  user: { id: string; email: string; name: string | null };
}

interface ActionItemsJobData {
  meetingId: string;
  transcriptId: string;
  organizationId: string;
}

async function processActionItems(job: Job<ActionItemsJobData>) {
  const { meetingId, transcriptId, organizationId } = job.data;

  console.log(`Extracting action items for meeting ${meetingId}`);

  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
  });

  if (!transcript?.fullText) {
    throw new Error("Transcript not found or empty");
  }

  try {
    const items = await extractActionItems(transcript.fullText);

    const members = await prisma.membership.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    const actionItems = await Promise.all(
      items.map(async (item) => {
        let ownerId: string | null = null;

        if (item.owner) {
          const member = members.find(
            (m: Member) =>
              m.user.email.toLowerCase().includes(item.owner!.toLowerCase()) ||
              m.user.name?.toLowerCase().includes(item.owner!.toLowerCase())
          );
          if (member) {
            ownerId = member.userId;
          }
        }

        return prisma.actionItem.create({
          data: {
            organizationId,
            meetingId,
            title: item.title,
            ownerId,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            priority: item.priority,
            status: "TODO",
            extractedByModel: "gpt-4o",
          },
        });
      })
    );

    console.log(
      `Extracted ${actionItems.length} action items for meeting ${meetingId}`
    );
    return { count: actionItems.length };
  } catch (error) {
    console.error(`Action items extraction failed for meeting ${meetingId}:`, error);
    throw error;
  }
}

export const actionItemsWorker = new Worker(
  "action-items",
  processActionItems,
  {
    connection,
    concurrency: 2,
  }
);

actionItemsWorker.on("completed", (job) => {
  console.log(`Action items job ${job.id} completed`);
});

actionItemsWorker.on("failed", (job, err) => {
  console.error(`Action items job ${job?.id} failed:`, err);
});
