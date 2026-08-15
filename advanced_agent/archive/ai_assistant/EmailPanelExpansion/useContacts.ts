"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUser } from "@supabase/auth-helpers-react";

export type Contact = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  source?: string;
  verified: boolean;
  tags: string[];
  last_contacted_at?: string;
  created_at: string;
};

export function useContacts(
  selectedList: string = "All Contacts",
  search: string = "",
) {
  const user = useUser();
  const queryClient = useQueryClient();

  const {
    data: contacts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contacts", user?.id, selectedList, search],
    queryFn: async (): Promise<Contact[]> => {
      if (!user?.id) throw new Error("No user");

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `email.ilike.%${search}%,first_name.ilike.%${search}%,company.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mutation: Delete contacts
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("contacts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  return {
    contacts,
    isLoading,
    error,
    refetch,
    deleteContacts: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
