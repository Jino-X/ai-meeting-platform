"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Calendar, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  meeting: {
    id: string;
    title: string;
  } | null;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface TaskBoardProps {
  tasks: Task[];
  members: Member[];
  slug: string;
}

const columns = [
  { id: "TODO", title: "To Do", color: "bg-gray-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-500" },
  { id: "REVIEW", title: "Review", color: "bg-purple-500" },
  { id: "DONE", title: "Done", color: "bg-green-500" },
];

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export function TaskBoard({ tasks: initialTasks, members, slug }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const previousTasks = [...tasks];

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update");
    } catch {
      setTasks(previousTasks);
      toast.error("Failed to update task status");
    }
  }

  function handleDragStart(taskId: string) {
    setDraggedTask(taskId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(columnId: string) {
    if (draggedTask) {
      updateTaskStatus(draggedTask, columnId);
      setDraggedTask(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);

        return (
          <div
            key={column.id}
            className="flex flex-col rounded-lg border bg-muted/30"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="flex items-center gap-2 border-b p-3">
              <div className={`h-3 w-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="ml-auto">
                {columnTasks.length}
              </Badge>
            </div>

            <div className="flex-1 space-y-2 p-2 min-h-[200px]">
              {columnTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/workspaces/${slug}/tasks/${task.id}`}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  className={`block rounded-lg border bg-background p-3 shadow-sm transition-all hover:shadow-md ${
                    draggedTask === task.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">
                        {task.title}
                      </p>
                      <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      {task.assignee ? (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assignee.image || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(task.assignee.name || task.assignee.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {task.assignee.name || task.assignee.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Unassigned
                        </span>
                      )}

                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
