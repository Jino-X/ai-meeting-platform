"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Plus, User, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActionItem {
  id: string;
  title: string;
  ownerId: string | null;
  dueDate: Date | string | null;
  priority: string;
  status: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface ActionItemsListProps {
  actionItems: ActionItem[];
  slug: string;
  meetingId: string;
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  REVIEW: "bg-purple-100 text-purple-800",
  DONE: "bg-green-100 text-green-800",
};

export function ActionItemsList({
  actionItems,
  slug,
  meetingId,
}: ActionItemsListProps) {
  const [items, setItems] = useState(actionItems);

  async function updateStatus(itemId: string, status: string) {
    try {
      const res = await fetch(`/api/action-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status } : item
        )
      );
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function convertToTask(item: ActionItem) {
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          assigneeId: item.ownerId,
          dueDate: item.dueDate,
          priority: item.priority,
          meetingId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      toast.success("Task created from action item");
    } catch {
      toast.error("Failed to create task");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Action Items
          </CardTitle>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No action items extracted yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <Badge className={priorityColors[item.priority]}>
                    {item.priority}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {item.owner && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.owner.name || item.owner.email}
                    </span>
                  )}
                  {item.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(new Date(item.dueDate))}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Select
                    value={item.status}
                    onValueChange={(value) => updateStatus(item.id, value)}
                  >
                    <SelectTrigger className="h-7 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">Todo</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => convertToTask(item)}
                  >
                    <ArrowRight className="mr-1 h-3 w-3" />
                    Create Task
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
