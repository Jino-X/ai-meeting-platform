"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  dueDate: string | null;
  meetingId: string | null;
  createdAt: string;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TasksResponse {
  data: Task[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface TaskFilters {
  status?: string;
  assigneeId?: string;
  priority?: string;
  dueBefore?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useTasks(orgSlug: string, filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.dueBefore) params.set("dueBefore", filters.dueBefore);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  return useQuery<TasksResponse>({
    queryKey: ["tasks", orgSlug, filters],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${orgSlug}/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
}

export function useTask(orgSlug: string, taskId: string) {
  return useQuery({
    queryKey: ["task", orgSlug, taskId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${orgSlug}/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!taskId,
  });
}

export function useCreateTask(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      assigneeId?: string;
      dueDate?: string;
      priority?: string;
      meetingId?: string;
    }) => {
      const res = await fetch(`/api/workspaces/${orgSlug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", orgSlug] });
    },
  });
}

export function useUpdateTask(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<Task> }) => {
      const res = await fetch(`/api/workspaces/${orgSlug}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update task");
      }
      return res.json();
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", orgSlug] });
      queryClient.invalidateQueries({ queryKey: ["task", orgSlug, taskId] });
    },
  });
}

export function useDeleteTask(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/workspaces/${orgSlug}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", orgSlug] });
    },
  });
}
