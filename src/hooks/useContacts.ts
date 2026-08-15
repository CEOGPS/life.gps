import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Contact = {
  id: string;
  user_id?: string;
  list_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  source?: string;
  verified?: boolean;
  verification_status?: string;
  category?: string;
  last_contacted_at?: string | null;
  created_at?: string;
};

export function useContacts(listId = "All Contacts", search = "") {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setContacts([]);
        return;
      }

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id);

      if (listId && listId !== "All Contacts") {
        query = query.eq("list_id", listId);
      }
      if (search) {
        query = query.or(
          `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`,
        );
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (!error && data) {
        setContacts(data as Contact[]);
      } else {
        setContacts([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [listId, search]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const deleteContacts = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("contacts").delete().in("id", ids);
      if (!error) {
        setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
      }
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { contacts, isLoading, refetch, deleteContacts, isDeleting };
}
