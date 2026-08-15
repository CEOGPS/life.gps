// lib/scrapers/ZoomInfoScraper.ts
export class ZoomInfoScraper {
  private apiKey: string;
  private baseUrl: string = "https://api.zoominfo.com/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchCompanies(params: {
    name?: string;
    industry?: string;
    revenue?: { min: number; max: number };
    employeeCount?: { min: number; max: number };
    location?: string;
    limit?: number;
  }): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/search/company`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName: params.name,
        industry: params.industry,
        annualRevenue: params.revenue,
        employeeCount: params.employeeCount,
        location: params.location,
        pageSize: params.limit || 100,
      }),
    });

    const data = await response.json();

    return (
      data.companies?.map((company: any) => ({
        company_name: company.name,
        company_domain: company.domain,
        industry: company.industry,
        revenue: company.annualRevenue,
        employees: company.employeeCount,
        location: company.location,
        linkedin_url: company.linkedinUrl,
        source: "zoominfo_company",
      })) || []
    );
  }

  async searchPeople(params: {
    title?: string;
    seniority?: string[];
    company?: string;
    industry?: string;
    location?: string;
    limit?: number;
  }): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/search/people`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobTitle: params.title,
        seniority: params.seniority,
        companyName: params.company,
        industry: params.industry,
        location: params.location,
        pageSize: params.limit || 100,
      }),
    });

    const data = await response.json();

    return (
      data.people?.map((person: any) => ({
        first_name: person.firstName,
        last_name: person.lastName,
        email: person.email,
        company: person.company?.name,
        job_title: person.jobTitle,
        linkedin_url: person.linkedinUrl,
        phone: person.phone,
        source: "zoominfo",
        enrichment: {
          seniority: person.seniority,
          departments: person.departments,
          skills: person.skills,
          education: person.education,
        },
      })) || []
    );
  }

  async enrichCompany(domain: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/enrich/company`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain: domain }),
    });

    const data = await response.json();

    return {
      name: data.name,
      domain: data.domain,
      industry: data.industry,
      sub_industry: data.subIndustry,
      revenue: data.annualRevenue,
      employees: data.employeeCount,
      founded: data.foundedYear,
      headquarters: data.headquarters,
      technologies: data.technologies,
      competitors: data.competitors,
      news: data.recentNews,
    };
  }

  async enrichContact(email: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/enrich/contact`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email }),
    });

    const data = await response.json();

    return {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      company: data.company?.name,
      job_title: data.jobTitle,
      linkedin_url: data.linkedinUrl,
      phone: data.phone,
      direct_dial: data.directDial,
      mobile_phone: data.mobilePhone,
    };
  }

  async buildListFromSearch(params: {
    industry: string;
    jobTitle: string;
    seniority: string[];
    companySize?: { min: number; max: number };
    location?: string;
    listName: string;
  }): Promise<{ contacts: any[]; total: number }> {
    // Search for people matching criteria
    const people = await this.searchPeople({
      title: params.jobTitle,
      seniority: params.seniority,
      industry: params.industry,
      location: params.location,
      limit: 500,
    });

    // Filter by company size if specified
    let filteredContacts = people;
    if (params.companySize) {
      const companies = await Promise.all(
        people.map((p) => this.enrichCompany(p.company)),
      );

      filteredContacts = people.filter((_, i) => {
        const size = companies[i]?.employees;
        return (
          size >= params.companySize!.min && size <= params.companySize!.max
        );
      });
    }

    return {
      contacts: filteredContacts,
      total: filteredContacts.length,
    };
  }

  async getCompanyTechnologies(domain: string): Promise<string[]> {
    const company = await this.enrichCompany(domain);
    return company.technologies || [];
  }

  async findIntentData(params: {
    topics: string[];
    timeframe?: string;
    limit?: number;
  }): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/intent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topics: params.topics,
        timeframe: params.timeframe || "30d",
        pageSize: params.limit || 100,
      }),
    });

    const data = await response.json();

    return (
      data.companies?.map((company: any) => ({
        company: company.name,
        domain: company.domain,
        intent_topics: company.intentTopics,
        intent_score: company.intentScore,
        decision_makers: company.keyContacts,
      })) || []
    );
  }
}
