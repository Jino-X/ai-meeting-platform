"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  participants: string[];
  scheduledAt: string | null;
  duration: number | null;
  status: string;
  source: string;
  createdAt: string;
}

interface MeetingsResponse {
  data: Meeting[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface MeetingFilters {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useMeetings(orgSlug: string, filters: MeetingFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  return useQuery<MeetingsResponse>({
    queryKey: ["meetings", orgSlug, filters],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${orgSlug}/meetings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch meetings");
      return res.json();
    },
  });
}

export function useMeeting(orgSlug: string, meetingId: string) {
  return useQuery({
    queryKey: ["meeting", orgSlug, meetingId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${orgSlug}/meetings/${meetingId}`);
      if (!res.ok) throw new Error("Failed to fetch meeting");
      return res.json();
    },
    enabled: !!meetingId,
  });
}

export function useCreateMeeting(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      participants?: string[];
      scheduledAt?: string;
      duration?: number;
    }) => {
      const res = await fetch(`/api/workspaces/${orgSlug}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create meeting");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", orgSlug] });
    },
  });
}

export function useUpdateMeeting(orgSlug: string, meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Meeting>) => {
      const res = await fetch(`/api/workspaces/${orgSlug}/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update meeting");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", orgSlug] });
      queryClient.invalidateQueries({ queryKey: ["meeting", orgSlug, meetingId] });
    },
  });
}

export function useDeleteMeeting(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      const res = await fetch(`/api/workspaces/${orgSlug}/meetings/${meetingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete meeting");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", orgSlug] });
    },
  });
}
