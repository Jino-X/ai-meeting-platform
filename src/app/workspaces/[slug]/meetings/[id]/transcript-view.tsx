"use client";

import { useState } from "react";
import { FileText, Search, Download } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TranscriptSegment {
  id: string;
  speakerLabel: string;
  speakerEmail: string | null;
  startTime: number;
  endTime: number;
  text: string;
  sentiment: number | null;
}

interface Transcript {
  id: string;
  status: string;
  language: string | null;
  fullText: string | null;
  wordCount: number | null;
}

interface TranscriptViewProps {
  transcript: Transcript;
  segments: TranscriptSegment[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getSentimentColor(sentiment: number | null): string {
  if (sentiment === null) return "";
  if (sentiment > 0.3) return "border-l-green-500";
  if (sentiment < -0.3) return "border-l-red-500";
  return "border-l-yellow-500";
}

export function TranscriptView({ transcript, segments }: TranscriptViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSegments = searchQuery
    ? segments.filter((s) =>
        s.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : segments;

  const speakerColors: Record<string, string> = {};
  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-purple-100 text-purple-800",
    "bg-orange-100 text-orange-800",
    "bg-pink-100 text-pink-800",
  ];

  segments.forEach((segment) => {
    if (!speakerColors[segment.speakerLabel]) {
      speakerColors[segment.speakerLabel] =
        colors[Object.keys(speakerColors).length % colors.length];
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        {transcript.wordCount && (
          <p className="text-sm text-muted-foreground">
            {transcript.wordCount.toLocaleString()} words •{" "}
            {transcript.language?.toUpperCase() || "EN"}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
          {filteredSegments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {searchQuery
                ? "No matching segments found"
                : "No transcript segments available"}
            </p>
          ) : (
            filteredSegments.map((segment) => (
              <div
                key={segment.id}
                className={`rounded-lg border-l-4 bg-muted/30 p-4 ${getSentimentColor(segment.sentiment)}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${speakerColors[segment.speakerLabel]}`}
                  >
                    {segment.speakerLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{segment.text}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
