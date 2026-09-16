import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient.ts";
import { useAuth } from "@/lib/SupabaseAuthContext";

export interface Contact {
  id: string;
  user_email: string;
  name: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  address: string;
  birthday: string;
  anniversary: string;
  relationship: string;
  notes: string;
  enriched: boolean;
  linkedin: string;
  twitter: string;
  instagram: string;
  facebook: string;
  company: string;
  title: string;
  industry: string;
  revenue_range: string;
  website: string;
  tags?: string[];
  favorite?: boolean;
  lastContacted?: string;
  created_at: string;
  updated_at: string;
}

/** Enhanced contact type with additional fields for UI operations */
export interface EnhancedContact extends Contact {
  communicationPreference?: "email" | "phone" | "sms" | "any";
  customFields?: Record<string, string>;
}

export interface ContactList {
  id: string;
  user_email: string;
  name: string;
  description: string;
  contact_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactListMember {
  contact_id: string;
  list_id: string;
  added_at: string;
}

export interface Lead {
  id: string;
  user_email: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  status: "Lead" | "Prospect" | "Client" | "Inactive";
  last_contacted: string;
  next_follow_up: string;
  enriched: boolean;
  linkedin: string;
  twitter: string;
  website: string;
  industry: string;
  revenue_range: string;
  employee_count: string;
  location: string;
  owner: string;
  source: string;
  deal_value: string;
  notes: string;
  tags: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

/** Enhanced lead type with additional fields for UI operations */
export interface EnhancedLead extends Lead {
  dealSize?: string;
  probability?: number;
  activities?: Array<{
    type: "email" | "call" | "meeting" | "note";
    date: string;
    description: string;
  }>;
  nextFollowUp?: string;
}

export interface Task {
  id: string;
  user_email: string;
  text: string;
  done: boolean;
  priority: "low" | "mid" | "high";
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_email: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_email: string;
  title: string;
  date: string;
  time?: string;
  type?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetBill {
  id: string;
  user_email: string;
  name: string;
  amount: number;
  due_date: string;
  paid: boolean;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_email: string;
  source: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  user_email: string;
  source: string;
  type?: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  user_email: string;
  name: string;
  desc: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessWebsite {
  id: string;
  user_email: string;
  name: string;
  url: string;
  platform: string;
  status: string;
  api_key: string;
  api_secret: string;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessReview {
  id: string;
  user_email: string;
  platform: string;
  external_id: string;
  author_name: string;
  rating: number;
  content: string;
  response_text: string;
  responded_at: string;
  review_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessListing {
  id: string;
  user_email: string;
  platform: string;
  listing_url: string;
  status: string;
  external_id: string;
  business_name: string;
  address: string;
  phone: string;
  website: string;
  hours: Record<string, any>;
  last_verified: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessAnalytics {
  id: string;
  user_email: string;
  website_id: string;
  date: string;
  visitors: number;
  pageviews: number;
  leads: number;
  conversions: number;
  revenue: number;
  bounce_rate: number;
  avg_session_duration: number;
  created_at: string;
}

export interface BusinessLead {
  id: string;
  user_email: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  value: number;
  notes: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

export interface LifeOSDataState {
  contacts: Contact[];
  leads: Lead[];
  tasks: Task[];
  notes: Note[];
  calendarEvents: CalendarEvent[];
  budgetBills: BudgetBill[];
  notifications: Notification[];
  activityEvents: ActivityEvent[];
  agents: Agent[];
  businessWebsites: BusinessWebsite[];
  businessReviews: BusinessReview[];
  businessListings: BusinessListing[];
  businessAnalytics: BusinessAnalytics[];
  businessLeads: BusinessLead[];
  loading: {
    contacts: boolean;
    leads: boolean;
    tasks: boolean;
    notes: boolean;
    calendarEvents: boolean;
    budgetBills: boolean;
    notifications: boolean;
    activityEvents: boolean;
    agents: boolean;
    businessWebsites: boolean;
    businessReviews: boolean;
    businessListings: boolean;
    businessAnalytics: boolean;
    businessLeads: boolean;
  };
}

interface LifeOSDataContextState extends LifeOSDataState {
  addContact: (contact: Omit<Contact, "id" | "user_email" | "created_at" | "updated_at">) => Promise<Contact | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  enrichContact: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, "id" | "user_email" | "created_at" | "updated_at">) => Promise<Lead | null>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLeadStatus: (id: string, status: Lead["status"]) => Promise<void>;
  enrichLead: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, "id" | "user_email" | "created_at" | "updated_at">) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addNote: (note: Omit<Note, "id" | "user_email" | "created_at" | "updated_at">) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addCalendarEvent: (event: Omit<CalendarEvent, "id" | "user_email" | "created_at" | "updated_at">) => Promise<CalendarEvent | null>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  addBudgetBill: (bill: Omit<BudgetBill, "id" | "user_email" | "created_at" | "updated_at">) => Promise<BudgetBill | null>;
  updateBudgetBill: (id: string, updates: Partial<BudgetBill>) => Promise<void>;
  deleteBudgetBill: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addActivityEvent: (event: Omit<ActivityEvent, "id" | "user_email" | "created_at">) => Promise<void>;
  markActivityRead: (id: string) => Promise<void>;
  dismissActivity: (id: string) => Promise<void>;
  createLeadFromContact: (contactId: string) => Promise<Lead | null>;
  createTaskFromLead: (leadId: string, text: string) => Promise<Task | null>;
  createBillFromDeal: (leadId: string) => Promise<BudgetBill | null>;
  addBusinessWebsite: (website: Omit<BusinessWebsite, "id" | "user_email" | "created_at" | "updated_at">) => Promise<BusinessWebsite | null>;
  updateBusinessWebsite: (id: string, updates: Partial<BusinessWebsite>) => Promise<void>;
  deleteBusinessWebsite: (id: string) => Promise<void>;
  addBusinessReview: (review: Omit<BusinessReview, "id" | "user_email" | "created_at" | "updated_at">) => Promise<BusinessReview | null>;
  updateBusinessReview: (id: string, updates: Partial<BusinessReview>) => Promise<void>;
  deleteBusinessReview: (id: string) => Promise<void>;
  addBusinessListing: (listing: Omit<BusinessListing, "id" | "user_email" | "created_at" | "updated_at">) => Promise<BusinessListing | null>;
  updateBusinessListing: (id: string, updates: Partial<BusinessListing>) => Promise<void>;
  deleteBusinessListing: (id: string) => Promise<void>;
  addBusinessAnalytics: (analytics: Omit<BusinessAnalytics, "id" | "user_email" | "created_at">) => Promise<BusinessAnalytics | null>;
  updateBusinessAnalytics: (id: string, updates: Partial<BusinessAnalytics>) => Promise<void>;
  deleteBusinessAnalytics: (id: string) => Promise<void>;
  addBusinessLead: (lead: Omit<BusinessLead, "id" | "user_email" | "created_at" | "updated_at">) => Promise<BusinessLead | null>;
  updateBusinessLead: (id: string, updates: Partial<BusinessLead>) => Promise<void>;
  deleteBusinessLead: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const LifeOSDataContext = createContext<LifeOSDataContextState | null>(null);

interface LifeOSDataProviderProps {
  children: ReactNode;
}

export function LifeOSDataProvider({ children }: LifeOSDataProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const userEmail = user?.email || "";
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [budgetBills, setBudgetBills] = useState<BudgetBill[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [businessWebsites, setBusinessWebsites] = useState<BusinessWebsite[]>([]);
  const [businessReviews, setBusinessReviews] = useState<BusinessReview[]>([]);
  const [businessListings, setBusinessListings] = useState<BusinessListing[]>([]);
  const [businessAnalytics, setBusinessAnalytics] = useState<BusinessAnalytics[]>([]);
  const [businessLeads, setBusinessLeads] = useState<BusinessLead[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contactListMembers, setContactListMembers] = useState<ContactListMember[]>([]);

  const [loading, setLoading] = useState({
    contacts: true,
    leads: true,
    tasks: true,
    notes: true,
    calendarEvents: true,
    budgetBills: true,
    notifications: true,
    activityEvents: true,
    agents: true,
    businessWebsites: true,
    businessReviews: true,
    businessListings: true,
    businessAnalytics: true,
    businessLeads: true,
    contactLists: true,
  });

  const insertRow = async <T,>(table: string, data: any) => {
    if (!userEmail) return null;
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert({ ...data, user_email: userEmail })
        .select()
        .single();
      if (error) throw error;
      return result as T;
    } catch (e) {
      console.error("[LifeOSData] insertRow failed (" + table + "):", e);
      return null;
    }
  };
  
  const updateRow = async (table: string, id: string, updates: any) => {
    if (!userEmail) return;
    try {
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq("id", id)
        .eq("user_email", userEmail);
      if (error) throw error;
    } catch (e) {
      console.error("[LifeOSData] updateRow failed (" + table + "):", e);
    }
  };
  
  const deleteRow = async (table: string, id: string) => {
    if (!userEmail) return;
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("user_email", userEmail);
      if (error) throw error;
    } catch (e) {
      console.error("[LifeOSData] deleteRow failed (" + table + "):", e);
    }
  };

  const loadContacts = useCallback(async () => {
      if (!userEmail) {
        setLoading(l => ({ ...l, contacts: false }));
        return;
      }
      setLoading(l => ({ ...l, contacts: true }));
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const mapped = (data || []).map((row: any) => ({
          id: row.id,
          user_email: userEmail,
          name: row.full_name || "",
          phone: row.phone || "",
          phone2: "",
          email: row.email || "",
          email2: "",
          address: row.address || "",
          birthday: row.birthday || "",
          anniversary: "",
          relationship: "",
          notes: "",
          enriched: row.enriched || false,
          linkedin: row.linkedin || "",
          twitter: row.twitter || "",
          instagram: "",
          facebook: "",
          company: row.company || "",
          title: "",
          industry: row.industry || "",
          revenue_range: row.revenue_range || "",
          employee_count: row.employee_count || "",
          website: row.website || "",
          tags: [],
          favorite: false,
          lastContacted: "",
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        }));
        setContacts(mapped);
      } catch (e) {
        console.error("[LifeOSData] loadContacts failed:", e);
        setContacts([]);
      } finally {
        setLoading(l => ({ ...l, contacts: false }));
      }
    }, [userEmail]);
  
  const loadLeads = useCallback(async () => {
      if (!userEmail) {
        setLoading(l => ({ ...l, leads: false }));
        return;
      }
      setLoading(l => ({ ...l, leads: true }));
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const mapped = (data || []).map((row: any) => ({
          id: row.id,
          user_email: userEmail,
          name: row.name || "",
          company: row.company || "",
          title: "",
          email: row.email || "",
          phone: "",
          status: row.status || "Lead",
          last_contacted: "",
          next_follow_up: "",
          enriched: false,
          linkedin: "",
          twitter: "",
          website: "",
          industry: "",
          revenue_range: "",
          employee_count: "",
          location: "",
          owner: "",
          source: row.source || "",
          deal_value: "",
          notes: "",
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        }));
        setLeads(mapped);
      } catch (e) {
        console.error("[LifeOSData] loadLeads failed:", e);
        setLeads([]);
      } finally {
        setLoading(l => ({ ...l, leads: false }));
      }
    }, [userEmail]);

  const loadTasks = useCallback(async () => {
    setLoading(l => ({ ...l, tasks: true }));
    try {
      setTasks([]);
    } finally {
      setLoading(l => ({ ...l, tasks: false }));
    }
  }, []);
  
  const loadNotes = useCallback(async () => {
    setLoading(l => ({ ...l, notes: true }));
    try {
      setNotes([]);
    } finally {
      setLoading(l => ({ ...l, notes: false }));
    }
  }, []);
  
  const loadCalendarEvents = useCallback(async () => {
    setLoading(l => ({ ...l, calendarEvents: true }));
    try {
      setCalendarEvents([]);
    } finally {
      setLoading(l => ({ ...l, calendarEvents: false }));
    }
  }, []);

  const loadBudgetBills = useCallback(async () => {
    setLoading(l => ({ ...l, budgetBills: true }));
    try {
      setBudgetBills([]);
    } finally {
      setLoading(l => ({ ...l, budgetBills: false }));
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(l => ({ ...l, notifications: true }));
    try {
      setNotifications([]);
    } finally {
      setLoading(l => ({ ...l, notifications: false }));
    }
  }, []);

  const loadActivityEvents = useCallback(async () => {
    setLoading(l => ({ ...l, activityEvents: true }));
    try {
      setActivityEvents([]);
    } finally {
      setLoading(l => ({ ...l, activityEvents: false }));
    }
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(l => ({ ...l, agents: true }));
    try {
      setAgents([]);
    } finally {
      setLoading(l => ({ ...l, agents: false }));
    }
  }, []);

  const loadBusinessWebsites = useCallback(async () => {
    setLoading(l => ({ ...l, businessWebsites: true }));
    try {
      setBusinessWebsites([]);
    } finally {
      setLoading(l => ({ ...l, businessWebsites: false }));
    }
  }, []);

  const loadBusinessReviews = useCallback(async () => {
    setLoading(l => ({ ...l, businessReviews: true }));
    try {
      setBusinessReviews([]);
    } finally {
      setLoading(l => ({ ...l, businessReviews: false }));
    }
  }, []);

  const loadBusinessListings = useCallback(async () => {
    setLoading(l => ({ ...l, businessListings: true }));
    try {
      setBusinessListings([]);
    } finally {
      setLoading(l => ({ ...l, businessListings: false }));
    }
  }, []);

  const loadBusinessAnalytics = useCallback(async () => {
    setLoading(l => ({ ...l, businessAnalytics: true }));
    try {
      setBusinessAnalytics([]);
    } finally {
      setLoading(l => ({ ...l, businessAnalytics: false }));
    }
  }, []);

  const loadBusinessLeads = useCallback(async () => {
    setLoading(l => ({ ...l, businessLeads: true }));
    try {
      setBusinessLeads([]);
    } finally {
      setLoading(l => ({ ...l, businessLeads: false }));
    }
  }, []);

  const loadContactLists = useCallback(async () => {
    setLoading(l => ({ ...l, contactLists: true }));
    try {
      setContactLists([]);
    } finally {
      setLoading(l => ({ ...l, contactLists: false }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      loadContacts(),
      loadLeads(),
      loadTasks(),
      loadNotes(),
      loadCalendarEvents(),
      loadBudgetBills(),
      loadNotifications(),
      loadActivityEvents(),
      loadAgents(),
      loadBusinessWebsites(),
      loadBusinessReviews(),
      loadBusinessListings(),
      loadBusinessAnalytics(),
      loadBusinessLeads(),
      loadContactLists(),
    ]);
  }, [loadContacts, loadLeads, loadTasks, loadNotes, loadCalendarEvents, loadBudgetBills, loadNotifications, loadActivityEvents, loadAgents, loadBusinessWebsites, loadBusinessReviews, loadBusinessListings, loadBusinessAnalytics, loadBusinessLeads, loadContactLists]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
  }, [isAuthenticated, refreshAll]);

  const addContact = async (contact: Omit<Contact, "id" | "user_email" | "created_at" | "updated_at">) => {
      const res = await insertRow<Contact>("contacts", contact);
      if (res) {
        setContacts(prev => [res, ...prev]);
      }
      return res;
    };

    const updateContact = async (id: string, updates: Partial<Contact>) => {
      await updateRow("contacts", id, updates);
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteContact = async (id: string) => {
      await deleteRow("contacts", id);
      setContacts(prev => prev.filter(c => c.id !== id));
    };

  const enrichContact = async (id: string) => {
    // Implementation logic
  };

  const addLead = async (lead: Omit<Lead, "id" | "user_email" | "created_at" | "updated_at">) => {
      const res = await insertRow<Lead>("leads", lead);
      if (res) {
        setLeads(prev => [res, ...prev]);
      }
      return res;
    };

    const updateLead = async (id: string, updates: Partial<Lead>) => {
      await updateRow("leads", id, updates);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const deleteLead = async (id: string) => {
      await deleteRow("leads", id);
      setLeads(prev => prev.filter(l => l.id !== id));
    };

    const moveLeadStatus = async (id: string, status: Lead["status"]) => {
      await updateRow("leads", id, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    };

  const enrichLead = async (id: string) => {
    // Implementation logic
  };

  const addTask = async (task: Omit<Task, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<Task>("lifeos_tasks", task);
    if (res) {
      setTasks(prev => [res, ...prev]);
    }
    return res;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await updateRow("lifeos_tasks", id, updates);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = async (id: string) => {
    await deleteRow("lifeos_tasks", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addNote = async (note: Omit<Note, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<Note>("lifeos_notes", note);
    if (res) {
      setNotes(prev => [res, ...prev]);
    }
    return res;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    await updateRow("lifeos_notes", id, updates);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = async (id: string) => {
    await deleteRow("lifeos_notes", id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const addCalendarEvent = async (event: Omit<CalendarEvent, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<CalendarEvent>("lifeos_calendar", event);
    if (res) {
      setCalendarEvents(prev => [res, ...prev]);
    }
    return res;
  };

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    await updateRow("lifeos_calendar", id, updates);
    setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteCalendarEvent = async (id: string) => {
    await deleteRow("lifeos_calendar", id);
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  const addBudgetBill = async (bill: Omit<BudgetBill, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<BudgetBill>("lifeos_bills", bill);
    if (res) {
      setBudgetBills(prev => [res, ...prev]);
    }
    return res;
  };

  const updateBudgetBill = async (id: string, updates: Partial<BudgetBill>) => {
    await updateRow("lifeos_bills", id, updates);
    setBudgetBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBudgetBill = async (id: string) => {
    await deleteRow("lifeos_bills", id);
    setBudgetBills(prev => prev.filter(b => b.id !== id));
  };

  const markNotificationRead = async (id: string) => {
    await updateRow("lifeos_notifications", id, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addActivityEvent = async (event: Omit<ActivityEvent, "id" | "user_email" | "created_at">) => {
    await insertRow("lifeos_activity", event);
    setActivityEvents(prev => [ { ...event, id: "temp", user_email: userEmail, created_at: new Date().toISOString() }, ...prev]);
  };

  const markActivityRead = async (id: string) => {
    await updateRow("lifeos_activity", id, { read: true });
    setActivityEvents(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const dismissActivity = async (id: string) => {
    await deleteRow("lifeos_activity", id);
    setActivityEvents(prev => prev.filter(e => e.id !== id));
  };

  const createLeadFromContact = async (contactId: string) => {
    return null;
  };

  const createTaskFromLead = async (leadId: string, text: string) => {
    return null;
  };

  const createBillFromDeal = async (leadId: string) => {
    return null;
  };

  const addBusinessWebsite = async (website: Omit<BusinessWebsite, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<BusinessWebsite>("business_websites", website);
    if (res) {
      setBusinessWebsites(prev => [res, ...prev]);
    }
    return res;
  };

  const updateBusinessWebsite = async (id: string, updates: Partial<BusinessWebsite>) => {
    await updateRow("business_websites", id, updates);
    setBusinessWebsites(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteBusinessWebsite = async (id: string) => {
    await deleteRow("business_websites", id);
    setBusinessWebsites(prev => prev.filter(w => w.id !== id));
  };

  const addBusinessReview = async (review: Omit<BusinessReview, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<BusinessReview>("business_reviews", review);
    if (res) {
      setBusinessReviews(prev => [res, ...prev]);
    }
    return res;
  };

  const updateBusinessReview = async (id: string, updates: Partial<BusinessReview>) => {
    await updateRow("business_reviews", id, updates);
    setBusinessReviews(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteBusinessReview = async (id: string) => {
    await deleteRow("business_reviews", id);
    setBusinessReviews(prev => prev.filter(r => r.id !== id));
  };

  const addBusinessListing = async (listing: Omit<BusinessListing, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<BusinessListing>("business_listings", listing);
    if (res) {
      setBusinessListings(prev => [res, ...prev]);
    }
    return res;
  };

  const updateBusinessListing = async (id: string, updates: Partial<BusinessListing>) => {
    await updateRow("business_listings", id, updates);
    setBusinessListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteBusinessListing = async (id: string) => {
    await deleteRow("business_listings", id);
    setBusinessListings(prev => prev.filter(l => l.id !== id));
  };

  const addBusinessAnalytics = async (analytics: Omit<BusinessAnalytics, "id" | "user_email" | "created_at">) => {
    const res = await insertRow<BusinessAnalytics>("business_analytics", analytics);
    if (res) {
      setBusinessAnalytics(prev => [res, ...prev]);
    }
    return res;
  };

  const updateBusinessAnalytics = async (id: string, updates: Partial<BusinessAnalytics>) => {
    await updateRow("business_analytics", id, updates);
    setBusinessAnalytics(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteBusinessAnalytics = async (id: string) => {
    await deleteRow("business_analytics", id);
    setBusinessAnalytics(prev => prev.filter(a => a.id !== id));
  };

  const addBusinessLead = async (lead: Omit<BusinessLead, "id" | "user_email" | "created_at" | "updated_at">) => {
    const res = await insertRow<BusinessLead>("business_leads", lead);
    if (res) {
      setBusinessLeads(prev => [res, ...prev]);
    }
    return res;
  };

  const updateBusinessLead = async (id: string, updates: Partial<BusinessLead>) => {
    await updateRow("business_leads", id, updates);
    setBusinessLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteBusinessLead = async (id: string) => {
    await deleteRow("business_leads", id);
    setBusinessLeads(prev => prev.filter(l => l.id !== id));
  };

  const value: LifeOSDataContextState = {
    contacts, leads, tasks, notes, calendarEvents, budgetBills, notifications, activityEvents, agents, businessWebsites, businessReviews, businessListings, businessAnalytics, businessLeads,
    loading,
    addContact, updateContact, deleteContact, enrichContact, addLead, updateLead, deleteLead, moveLeadStatus, enrichLead, addTask, updateTask, deleteTask, addNote, updateNote, deleteNote, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, addBudgetBill, updateBudgetBill, deleteBudgetBill, markNotificationRead, markAllNotificationsRead, addActivityEvent, markActivityRead, dismissActivity, createLeadFromContact, createTaskFromLead, createBillFromDeal, addBusinessWebsite, updateBusinessWebsite, deleteBusinessWebsite, addBusinessReview, updateBusinessReview, deleteBusinessReview, addBusinessListing, updateBusinessListing, deleteBusinessListing, addBusinessAnalytics, updateBusinessAnalytics, deleteBusinessAnalytics, addBusinessLead, updateBusinessLead, deleteBusinessLead, refreshAll,
  };

  return <LifeOSDataContext.Provider value={value}>{children}</LifeOSDataContext.Provider>;
}

export const useLifeOSData = () => {
  const context = useContext(LifeOSDataContext);
  if (context === undefined || context === null) {
    throw new Error("useLifeOSData must be used within a LifeOSDataProvider");
  }
  return context;
};