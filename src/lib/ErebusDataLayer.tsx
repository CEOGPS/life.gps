import { supabase } from "@/lib/supabaseClient.ts";
import { useAuth } from "@/lib/SupabaseAuthContext.tsx";
import type { LifeOSDataState } from "./LifeOSDataContext.tsx";

/**
 * ErebusAgentDataLayer - Provides AI agents (Erebus, Kranos, Sentinel) 
 * with read/write access to all LifeOS data
 * 
 * This is the data access layer that autonomous agents use to:
 * - Read cross-panel context for decision making
 * - Write actions back to the system
 * - Subscribe to real-time changes
 * - Execute complex multi-step workflows
 */

export interface AgentActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  // User context
  userEmail: string;
  userProfile: {
    name: string;
    company: string;
    title: string;
    location: string;
  };
  
  // Current state snapshots
  contacts: LifeOSDataState["contacts"];
  leads: LifeOSDataState["leads"];
  tasks: LifeOSDataState["tasks"];
  notes: LifeOSDataState["notes"];
  calendarEvents: LifeOSDataState["calendarEvents"];
  budgetBills: LifeOSDataState["budgetBills"];
  notifications: LifeOSDataState["notifications"];
  activityEvents: LifeOSDataState["activityEvents"];
  
  // Derived insights
  insights: {
    totalRevenue: number;
    pendingDeals: number;
    overdueTasks: number;
    unreadNotifications: number;
    upcomingEvents: number;
    topSources: string[];
  };
}

export interface AgentCapabilities {
  // Read operations
  getContacts: (filter?: Partial<LifeOSDataState["contacts"][0]>) => Promise<AgentActionResult<LifeOSDataState["contacts"]>>;
  getLeads: (filter?: Partial<LifeOSDataState["leads"][0]>) => Promise<AgentActionResult<LifeOSDataState["leads"]>>;
  getTasks: (filter?: Partial<LifeOSDataState["tasks"][0]>) => Promise<AgentActionResult<LifeOSDataState["tasks"]>>;
  getNotes: (filter?: Partial<LifeOSDataState["notes"][0]>) => Promise<AgentActionResult<LifeOSDataState["notes"]>>;
  getCalendarEvents: (filter?: Partial<LifeOSDataState["calendarEvents"][0]>) => Promise<AgentActionResult<LifeOSDataState["calendarEvents"]>>;
  getBudgetBills: (filter?: Partial<LifeOSDataState["budgetBills"][0]>) => Promise<AgentActionResult<LifeOSDataState["budgetBills"]>>;
  getNotifications: (filter?: Partial<LifeOSDataState["notifications"][0]>) => Promise<AgentActionResult<LifeOSDataState["notifications"]>>;
  getActivityEvents: (filter?: Partial<LifeOSDataState["activityEvents"][0]>) => Promise<AgentActionResult<LifeOSDataState["activityEvents"]>>;
  
  // Write operations
  createContact: (contact: Omit<LifeOSDataState["contacts"][0], "id" | "user_email" | "created_at" | "updated_at">) => Promise<AgentActionResult<LifeOSDataState["contacts"][0]>>;
  updateContact: (id: string, updates: Partial<LifeOSDataState["contacts"][0]>) => Promise<AgentActionResult<void>>;
  deleteContact: (id: string) => Promise<AgentActionResult<void>>;
  
  createLead: (lead: Omit<LifeOSDataState["leads"][0], "id" | "user_email" | "created_at" | "updated_at">) => Promise<AgentActionResult<LifeOSDataState["leads"][0]>>;
  updateLead: (id: string, updates: Partial<LifeOSDataState["leads"][0]>) => Promise<AgentActionResult<void>>;
  deleteLead: (id: string) => Promise<AgentActionResult<void>>;
  moveLeadStatus: (id: string, status: LifeOSDataState["leads"][0]["status"]) => Promise<AgentActionResult<void>>;
  
  createTask: (task: Omit<LifeOSDataState["tasks"][0], "id" | "user_email" | "created_at" | "updated_at">) => Promise<AgentActionResult<LifeOSDataState["tasks"][0]>>;
  updateTask: (id: string, updates: Partial<LifeOSDataState["tasks"][0]>) => Promise<AgentActionResult<void>>;
  deleteTask: (id: string) => Promise<AgentActionResult<void>>;
  
  createNote: (note: Omit<LifeOSDataState["notes"][0], "id" | "user_email" | "created_at" | "updated_at">) => Promise<AgentActionResult<LifeOSDataState["notes"][0]>>;
  updateNote: (id: string, updates: Partial<LifeOSDataState["notes"][0]>) => Promise<AgentActionResult<void>>;
  deleteNote: (id: string) => Promise<AgentActionResult<void>>;
  
  createCalendarEvent: (event: Omit<LifeOSDataState["calendarEvents"][0], "id" | "user_email" | "created_at" | "updated_at">) => Promise<AgentActionResult<LifeOSDataState["calendarEvents"][0]>>;
  updateCalendarEvent: (id: string, updates: Partial<LifeOSDataState["calendarEvents"][0]>) => Promise<AgentActionResult<void>>;
  deleteCalendarEvent: (id: string) => Promise<AgentActionResult<void>>;
  
  createBudgetBill: (bill: Omit<LifeOSDataState["budgetBills"][0], "id" | "user_email" | "created_at" | "updated_at">) => Promise<AgentActionResult<LifeOSDataState["budgetBills"][0]>>;
  updateBudgetBill: (id: string, updates: Partial<LifeOSDataState["budgetBills"][0]>) => Promise<AgentActionResult<void>>;
  deleteBudgetBill: (id: string) => Promise<AgentActionResult<void>>;
  
  // Cross-panel workflows
  convertContactToLead: (contactId: string) => Promise<AgentActionResult<LifeOSDataState["leads"][0]>>;
  createTaskFromLead: (leadId: string, text: string) => Promise<AgentActionResult<LifeOSDataState["tasks"][0]>>;
  createBillFromDeal: (leadId: string) => Promise<AgentActionResult<LifeOSDataState["budgetBills"][0]>>;
  
  // Intelligence
  getFullContext: () => Promise<AgentActionResult<AgentContext>>;
  searchAll: (query: string) => Promise<AgentActionResult<{ contacts: any[]; leads: any[]; tasks: any[]; notes: any[] }>>;
  
  // Real-time
  subscribe: (table: string, callback: (payload: any) => void) => Promise<() => void>;
}

/**
 * Creates the Erebus agent data layer with full access to LifeOS data
 * This is typically instantiated once per agent session
 */
export function createErebusDataLayer(): AgentCapabilities {
  const { user } = useAuth();
  const userEmail = user?.email || "";
  
  // Helper for Supabase queries
  const query = <T,>(table: string, filters: Record<string, any> = {}) => {
    let q = supabase.from(table).select("*").eq("user_email", userEmail);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) q = q.eq(key, value);
    });
    return q as any;
  };
  
  const mutate = async <T,>(table: string, operation: "insert" | "update" | "delete", data: Partial<T> | string, matchId?: string) => {
    try {
      let result;
      if (operation === "insert") {
        const { data: insertData, error } = await supabase.from(table).insert({ ...(data as object), user_email: userEmail }).select().single();
        if (error) throw error;
        result = insertData;
      } else if (operation === "update") {
        const { error } = await supabase.from(table).update(data).eq("id", matchId!).eq("user_email", userEmail);
        if (error) throw error;
        result = { success: true };
      } else if (operation === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", data).eq("user_email", userEmail);
        if (error) throw error;
        result = { success: true };
      }
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Filter helper
  const applyFilter = <T,>(data: T[], filter?: Partial<T>) => {
    if (!filter) return data;
    return data.filter(item => 
      Object.entries(filter).every(([key, value]) => 
        value === undefined || (item as any)[key] === value
      )
    );
  };
  
  return {
    // ========== READ OPERATIONS ==========
    async getContacts(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["contacts"][0]>("contacts", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async getLeads(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["leads"][0]>("leads", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async getTasks(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["tasks"][0]>("tasks", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async getNotes(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["notes"][0]>("notes", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async getCalendarEvents(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["calendarEvents"][0]>("calendar_events", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async getBudgetBills(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["budgetBills"][0]>("budget_bills", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async getNotifications(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["notifications"][0]>("notifications", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async getActivityEvents(filter) {
      try {
        const { data, error } = await query<LifeOSDataState["activityEvents"][0]>("activity_events", filter || {});
        if (error) throw error;
        return { success: true, data: applyFilter(data || [], filter) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    // ========== WRITE OPERATIONS ==========
    async createContact(contact) {
      return mutate("contacts", "insert", contact);
    },
    
    async updateContact(id, updates) {
      return mutate("contacts", "update", updates, id);
    },
    
    async deleteContact(id) {
      return mutate("contacts", "delete", id);
    },
    
    async createLead(lead) {
      return mutate("leads", "insert", lead);
    },
    
    async updateLead(id, updates) {
      // Map camelCase to snake_case
      const supabaseUpdates: any = { ...updates };
      if ((updates as any).lastContacted !== undefined) supabaseUpdates.last_contacted = (updates as any).lastContacted;
      if ((updates as any).nextFollowUp !== undefined) supabaseUpdates.next_follow_up = (updates as any).nextFollowUp;
      if ((updates as any).revenueRange !== undefined) supabaseUpdates.revenue_range = (updates as any).revenueRange;
      if ((updates as any).employeeCount !== undefined) supabaseUpdates.employee_count = (updates as any).employeeCount;
      if ((updates as any).dealValue !== undefined) supabaseUpdates.deal_value = (updates as any).dealValue;
      return mutate("leads", "update", supabaseUpdates, id);
    },
    
    async deleteLead(id) {
      return mutate("leads", "delete", id);
    },
    
    async moveLeadStatus(id, status) {
      return mutate("leads", "update", { status }, id);
    },
    
    async createTask(task) {
      return mutate("tasks", "insert", task);
    },
    
    async updateTask(id, updates) {
      return mutate("tasks", "update", updates, id);
    },
    
    async deleteTask(id) {
      return mutate("tasks", "delete", id);
    },
    
    async createNote(note) {
      return mutate("notes", "insert", note);
    },
    
    async updateNote(id, updates) {
      return mutate("notes", "update", updates, id);
    },
    
    async deleteNote(id) {
      return mutate("notes", "delete", id);
    },
    
    async createCalendarEvent(event) {
      return mutate("calendar_events", "insert", event);
    },
    
    async updateCalendarEvent(id, updates) {
      return mutate("calendar_events", "update", updates, id);
    },
    
    async deleteCalendarEvent(id) {
      return mutate("calendar_events", "delete", id);
    },
    
    async createBudgetBill(bill) {
      return mutate("budget_bills", "insert", bill);
    },
    
    async updateBudgetBill(id, updates) {
      return mutate("budget_bills", "update", updates, id);
    },
    
    async deleteBudgetBill(id) {
      return mutate("budget_bills", "delete", id);
    },
    
    // ========== CROSS-PANEL WORKFLOWS ==========
    async convertContactToLead(contactId) {
      try {
        const { data: contact, error } = await supabase
          .from("contacts")
          .select("*")
          .eq("id", contactId)
          .eq("user_email", userEmail)
          .single();
        
        if (error || !contact) throw error || new Error("Contact not found");
        
        const newLead = {
          name: contact.name,
          company: contact.company || "",
          title: contact.title || "",
          email: contact.email,
          phone: contact.phone,
          status: "Lead",
          last_contacted: "",
          next_follow_up: "",
          enriched: contact.enriched,
          linkedin: contact.linkedin,
          twitter: contact.twitter,
          website: contact.website,
          industry: contact.industry,
          revenue_range: contact.revenue_range,
          employee_count: "",
          location: contact.address,
          owner: "",
          source: "Contacts Import",
          deal_value: "",
          notes: contact.notes,
        };
        
        return mutate("leads", "insert", newLead);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async createTaskFromLead(leadId, text) {
      return mutate("tasks", "insert", { text, done: false, priority: "mid" });
    },
    
    async createBillFromDeal(leadId) {
      try {
        const { data: lead, error } = await supabase
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .eq("user_email", userEmail)
          .single();
        
        if (error || !lead) throw error || new Error("Lead not found");
        if (!lead.deal_value) throw new Error("No deal value");
        
        const amount = parseFloat(lead.deal_value.replace(/[$,]/g, "")) || 0;
        if (amount <= 0) throw new Error("Invalid deal amount");
        
        return mutate("budget_bills", "insert", {
          name: `Deal: ${lead.name} (${lead.company})`,
          amount,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          paid: false,
          type: "deal",
        });
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    // ========== INTELLIGENCE ==========
    async getFullContext() {
      try {
        const [
          contacts,
          leads,
          tasks,
          notes,
          calendarEvents,
          budgetBills,
          notifications,
          activityEvents,
        ] = await Promise.all([
          query("contacts"),
          query("leads"),
          query("tasks"),
          query("notes"),
          query("calendar_events"),
          query("budget_bills"),
          query("notifications"),
          query("activity_events"),
        ]);
        
        const allContacts = contacts || [];
        const allLeads = leads || [];
        const allTasks = tasks || [];
        const allNotes = notes || [];
        const allCalendarEvents = calendarEvents || [];
        const allBudgetBills = budgetBills || [];
        const allNotifications = notifications || [];
        const allActivityEvents = activityEvents || [];
        
        // Calculate insights
        const totalRevenue = allBudgetBills
          .filter(b => b.paid)
          .reduce((sum, b) => sum + (b.amount || 0), 0);
        
        const pendingDeals = allLeads
          .filter(l => l.status !== "Client" && l.status !== "Inactive" && l.deal_value)
          .reduce((sum, l) => sum + (parseFloat(l.deal_value.replace(/[$,]/g, "")) || 0), 0);
        
        const overdueTasks = allTasks.filter(t => !t.done).length;
        const unreadNotifications = allNotifications.filter(n => !n.read).length;
        const now = new Date();
        const upcomingEvents = allCalendarEvents.filter(e => new Date(e.date) >= now).length;
        
        const sourceCounts: Record<string, number> = {};
        allLeads.forEach(l => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });
        const topSources = Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([source]) => source);
        
        return {
          success: true,
          data: {
            userEmail,
            userProfile: {
              name: "", // Would come from profile
              company: "",
              title: "",
              location: "",
            },
            contacts: allContacts,
            leads: allLeads,
            tasks: allTasks,
            notes: allNotes,
            calendarEvents: allCalendarEvents,
            budgetBills: allBudgetBills,
            notifications: allNotifications,
            activityEvents: allActivityEvents,
            insights: {
              totalRevenue,
              pendingDeals,
              overdueTasks,
              unreadNotifications,
              upcomingEvents,
              topSources,
            },
          },
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    async searchAll(queryStr) {
      try {
        const lowerQuery = queryStr.toLowerCase();
        const [contacts, leads, tasks, notes] = await Promise.all([
          query("contacts"),
          query("leads"),
          query("tasks"),
          query("notes"),
        ]);
        
        return {
          success: true,
          data: {
            contacts: (contacts || []).filter(c => 
              c.name?.toLowerCase().includes(lowerQuery) ||
              c.email?.toLowerCase().includes(lowerQuery) ||
              c.company?.toLowerCase().includes(lowerQuery)
            ),
            leads: (leads || []).filter(l => 
              l.name?.toLowerCase().includes(lowerQuery) ||
              l.company?.toLowerCase().includes(lowerQuery) ||
              l.email?.toLowerCase().includes(lowerQuery)
            ),
            tasks: (tasks || []).filter(t => 
              t.text?.toLowerCase().includes(lowerQuery)
            ),
            notes: (notes || []).filter(n => 
              n.title?.toLowerCase().includes(lowerQuery) ||
              n.content?.toLowerCase().includes(lowerQuery)
            ),
          },
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    
    // ========== REAL-TIME ==========
    async subscribe(table, callback) {
      const channel = supabase.channel(`agent-${table}-${Date.now()}`)
        .on("postgres_changes", { event: "*", schema: "public", table, filter: `user_email=eq.${userEmail}` }, callback)
        .subscribe();
      
      return () => supabase.removeChannel(channel);
    },
  };
}

/**
 * Hook for React components to access agent data layer
 * Use this in agent components or when building agent UIs
 */
export function useErebusDataLayer(): AgentCapabilities | null {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user?.email) return null;
  
  // In practice, this would return the actual data layer instance
  // For now, return null and use createErebusDataLayer() directly
  return null;
}

/**
 * Agent prompt context builder - creates rich context for LLM prompts
 */
export async function buildAgentPromptContext(
  dataLayer: AgentCapabilities,
  focusAreas?: string[]
): Promise<string> {
  const context = await dataLayer.getFullContext();
  if (!context.success || !context.data) return "Unable to load context";
  
  const { insights, ...data } = context.data;
  const areas = focusAreas || ["contacts", "leads", "tasks", "calendar", "finance"];
  
  let prompt = `CURRENT LIFEOS STATE (${new Date().toLocaleString()}):\n\n`;
  
  prompt += `📊 KEY INSIGHTS:\n`;
  prompt += `  • Total Revenue: $${insights.totalRevenue.toLocaleString()}\n`;
  prompt += `  • Pending Deals: $${insights.pendingDeals.toLocaleString()}\n`;
  prompt += `  • Overdue Tasks: ${insights.overdueTasks}\n`;
  prompt += `  • Unread Notifications: ${insights.unreadNotifications}\n`;
  prompt += `  • Upcoming Events: ${insights.upcomingEvents}\n`;
  prompt += `  • Top Lead Sources: ${insights.topSources.join(", ") || "None"}\n\n`;
  
  if (areas.includes("contacts")) {
    prompt += `👥 CONTACTS (${data.contacts?.length || 0}):\n`;
    data.contacts?.slice(0, 5).forEach(c => {
      prompt += `  • ${c.name} (${c.email}) - ${c.company || "Personal"} ${c.enriched ? "✨" : ""}\n`;
    });
    if ((data.contacts?.length || 0) > 5) prompt += `  ... and ${data.contacts.length - 5} more\n`;
    prompt += "\n";
  }
  
  if (areas.includes("leads")) {
    prompt += `🎯 LEADS/CRM (${data.leads?.length || 0}):\n`;
    const byStatus: Record<string, number> = {};
    data.leads?.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
    Object.entries(byStatus).forEach(([status, count]) => {
      prompt += `  • ${status}: ${count}\n`;
    });
    prompt += "\n";
  }
  
  if (areas.includes("tasks")) {
    prompt += `✅ TASKS (${data.tasks?.length || 0}):\n`;
    const done = data.tasks?.filter(t => t.done).length || 0;
    const pending = (data.tasks?.length || 0) - done;
    prompt += `  • Done: ${done}, Pending: ${pending}\n`;
    data.tasks?.filter(t => !t.done).slice(0, 3).forEach(t => {
      prompt += `  • [${t.priority}] ${t.text}\n`;
    });
    prompt += "\n";
  }
  
  if (areas.includes("calendar")) {
    prompt += `📅 UPCOMING EVENTS (${data.calendarEvents?.length || 0}):\n`;
    const now = new Date();
    const upcoming = data.calendarEvents
      ?.filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3) || [];
    upcoming.forEach(e => {
      prompt += `  • ${e.date}: ${e.title} ${e.time ? `@ ${e.time}` : ""}\n`;
    });
    prompt += "\n";
  }
  
  if (areas.includes("finance")) {
    prompt += `💰 FINANCIAL:\n`;
    prompt += `  • Bills: ${data.budgetBills?.length || 0}\n`;
    const unpaid = data.budgetBills?.filter(b => !b.paid).length || 0;
    const paid = data.budgetBills?.filter(b => b.paid).length || 0;
    prompt += `  • Paid: ${paid}, Unpaid: ${unpaid}\n`;
    const totalDue = data.budgetBills?.filter(b => !b.paid).reduce((sum, b) => sum + b.amount, 0) || 0;
    prompt += `  • Total Due: $${totalDue.toLocaleString()}\n`;
    prompt += "\n";
  }
  
  return prompt;
}

export default createErebusDataLayer;