import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioUrl: string): Promise<{
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
}> {
  const response = await fetch(audioUrl);
  const audioBlob = await response.blob();
  const audioFile = new File([audioBlob], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  return {
    text: transcription.text,
    segments: (transcription.segments || []).map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    })),
  };
}

export async function generateSummary(transcript: string): Promise<{
  executiveSummary: string;
  keyPoints: string[];
  risks: string[];
  decisions: string[];
  nextSteps: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert meeting analyst. Analyze the following meeting transcript and provide:
1. An executive summary (2-3 sentences)
2. Key points discussed (3-5 bullet points)
3. Risks or concerns raised (if any)
4. Decisions made (if any)
5. Next steps or action items mentioned (if any)

Respond in JSON format with keys: executiveSummary, keyPoints, risks, decisions, nextSteps (all arrays except executiveSummary which is a string).`,
      },
      {
        role: "user",
        content: transcript,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    executiveSummary: parsed.executiveSummary || "",
    keyPoints: parsed.keyPoints || [],
    risks: parsed.risks || [],
    decisions: parsed.decisions || [],
    nextSteps: parsed.nextSteps || [],
  };
}

export async function extractActionItems(transcript: string): Promise<
  Array<{
    title: string;
    owner?: string;
    dueDate?: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>
> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at extracting action items from meeting transcripts. For each action item, identify:
1. The task title (clear, actionable description)
2. The owner (person's name or email if mentioned)
3. Due date (if mentioned)
4. Priority (LOW, MEDIUM, HIGH, or CRITICAL based on urgency)

Respond in JSON format with an array of objects with keys: title, owner, dueDate, priority.`,
      },
      {
        role: "user",
        content: transcript,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return (parsed.actionItems || []).map((item: Record<string, unknown>) => ({
    title: item.title || "Untitled task",
    owner: item.owner,
    dueDate: item.dueDate,
    priority: item.priority || "MEDIUM",
  }));
}

export async function analyzeSentiment(
  text: string
): Promise<{ score: number; label: string }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Analyze the sentiment of the following text. Return a JSON object with:
- score: a number between -1 (very negative) and 1 (very positive)
- label: one of "positive", "negative", or "neutral"`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    score: parsed.score || 0,
    label: parsed.label || "neutral",
  };
}

export { openai };
