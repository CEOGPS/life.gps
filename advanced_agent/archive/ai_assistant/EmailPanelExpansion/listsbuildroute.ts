// app/api/lists/build/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ZoomInfoScraper } from "@/lib/scrapers/ZoomInfoScraper";
import { LinkedInScraper } from "@/lib/scrapers/LinkedInScraper";

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { source, filters, listName, enrichmentEnabled = false } = body;

  try {
    let contacts = [];
    let enrichment = {};

    switch (source) {
      case "zoominfo":
        const zoominfoScraper = new ZoomInfoScraper(
          process.env.ZOOMINFO_API_KEY!,
        );

        if (filters.searchType === "people") {
          // Search for people by criteria
          const result = await zoominfoScraper.searchPeople({
            title: filters.jobTitle,
            seniority: filters.seniority?.split(","),
            company: filters.company,
            industry: filters.industry,
            location: filters.location,
            limit: filters.limit || 100,
          });
          contacts = result;
        } else if (filters.searchType === "companies") {
          // Search for companies first, then get their decision makers
          const companies = await zoominfoScraper.searchCompanies({
            industry: filters.industry,
            employeeCount: {
              min: filters.minEmployees || 0,
              max: filters.maxEmployees || 10000,
            },
            location: filters.location,
            limit: filters.limit || 50,
          });

          // Get decision makers for each company
          for (const company of companies) {
            const decisionMakers = await zoominfoScraper.searchPeople({
              company: company.company_name,
              seniority: ["C-Level", "VP", "Director"],
              limit: 5,
            });
            contacts.push(...decisionMakers);
          }
        } else if (filters.searchType === "intent") {
          // Find companies showing intent on specific topics
          const intentCompanies = await zoominfoScraper.findIntentData({
            topics: filters.intentTopics?.split(","),
            limit: filters.limit || 100,
          });

          // Get contacts from intent companies
          for (const company of intentCompanies) {
            const decisionMakers = await zoominfoScraper.searchPeople({
              company: company.company,
              seniority: ["C-Level", "VP", "Director", "Manager"],
              limit: 3,
            });
            contacts.push(...decisionMakers);
          }
        }

        // Enrich contacts if requested
        if (enrichmentEnabled && contacts.length > 0) {
          for (let i = 0; i < Math.min(contacts.length, 50); i++) {
            const enriched = await zoominfoScraper.enrichContact(
              contacts[i].email,
            );
            contacts[i] = { ...contacts[i], ...enriched };
          }
        }
        break;

      case "linkedin":
        const linkedinScraper = new LinkedInScraper(
          process.env.LINKEDIN_API_KEY!,
        );
        contacts = await linkedinScraper.searchSalesNavigator(
          filters.keyword,
          filters.industry,
          filters.limit || 100,
        );
        break;

      case "csv":
        // CSV upload handling
        const csvData = await request.formData();
        const file = csvData.get("file");
        contacts = await parseCSV(file);
        break;

      default:
        return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    // Create list if specified
    let listId = null;
    if (listName) {
      const { data: list } = await supabase
        .from("contact_lists")
        .insert({
          user_id: user.id,
          name: listName,
          description: `Imported from ${source} with filters: ${JSON.stringify(filters)}`,
          source: source,
          filters: filters,
        })
        .select()
        .single();

      listId = list.id;
    }

    // Save contacts to database with deduplication
    const savedContacts = [];
    const duplicates = [];

    for (const contact of contacts) {
      if (!contact.email) continue;

      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", contact.email)
        .eq("user_id", user.id)
        .single();

      let contactId;
      if (!existing) {
        const { data: newContact, error } = await supabase
          .from("contacts")
          .insert({
            user_id: user.id,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name,
            company: contact.company,
            job_title: contact.job_title,
            linkedin_url: contact.linkedin_url,
            phone: contact.phone,
            source: source,
            source_data: contact.enrichment || {},
            verification_status: "pending",
            tags: filters.tags?.split(",") || [],
          })
          .select()
          .single();

        if (!error) {
          contactId = newContact.id;
          savedContacts.push(newContact);
        }
      } else {
        contactId = existing.id;
        duplicates.push(contact.email);
      }

      // Add to list
      if (listId && contactId) {
        await supabase.from("contact_list_members").upsert({
          contact_id: contactId,
          list_id: listId,
        });
      }
    }

    // Start verification for new contacts
    if (savedContacts.length > 0) {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/contacts/verify-batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactIds: savedContacts.map((c) => c.id),
          }),
        },
      );
    }

    return NextResponse.json({
      success: true,
      imported: savedContacts.length,
      duplicates: duplicates.length,
      total: contacts.length,
      listId,
      enrichmentApplied: enrichmentEnabled,
    });
  } catch (error: any) {
    console.error("List building error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to build list" },
      { status: 500 },
    );
  }
}

async function parseCSV(file: any): Promise<any[]> {
  const text = await file.text();
  const lines = text.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",");
      const contact: any = {};
      headers.forEach((header, i) => {
        contact[header] = values[i]?.trim();
      });
      return contact;
    });
}
