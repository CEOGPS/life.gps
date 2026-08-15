/**
 * KPI Service
 * Manages KPI data, calculations, and integrations across LifeOS1
 */

export const KPI_MODULES = [
  {
    id: "financial",
    name: "Financial KPIs",
    icon: "💰",
    color: "#4ab3f4",
    desc: "Revenue, costs, profit margins",
  },
  {
    id: "social",
    name: "Social KPIs",
    icon: "📱",
    color: "#ff6b9d",
    desc: "Followers, engagement, reach",
  },
  {
    id: "website",
    name: "Website KPIs",
    icon: "🌐",
    color: "#00c896",
    desc: "Traffic, conversions, bounce rate",
  },
  {
    id: "health",
    name: "Health KPIs",
    icon: "❤️",
    color: "#ff8c42",
    desc: "Sleep, exercise, wellness",
  },
];

// ── KPI Data Structure ───────────────────────────────────────────────────────
export const DEFAULT_KPIS = {
  financial: [
    {
      id: "revenue",
      name: "Monthly Revenue",
      value: 0,
      unit: "$",
      target: 50000,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "profit",
      name: "Profit Margin",
      value: 0,
      unit: "%",
      target: 30,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "costs",
      name: "Operating Costs",
      value: 0,
      unit: "$",
      target: 20000,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "expenses",
      name: "Total Expenses",
      value: 0,
      unit: "$",
      target: 15000,
      trend: 0,
      lastUpdated: null,
    },
  ],
  social: [
    {
      id: "followers",
      name: "Total Followers",
      value: 0,
      unit: "#",
      target: 50000,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "engagement",
      name: "Engagement Rate",
      value: 0,
      unit: "%",
      target: 5,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "reach",
      name: "Monthly Reach",
      value: 0,
      unit: "#",
      target: 100000,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "posts",
      name: "Posts/Month",
      value: 0,
      unit: "#",
      target: 20,
      trend: 0,
      lastUpdated: null,
    },
  ],
  website: [
    {
      id: "traffic",
      name: "Monthly Visitors",
      value: 0,
      unit: "#",
      target: 100000,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "conversions",
      name: "Conversion Rate",
      value: 0,
      unit: "%",
      target: 3,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "bounce",
      name: "Bounce Rate",
      value: 0,
      unit: "%",
      target: 40,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "avgTime",
      name: "Avg. Time on Site",
      value: 0,
      unit: "s",
      target: 300,
      trend: 0,
      lastUpdated: null,
    },
  ],
  health: [
    {
      id: "sleep",
      name: "Avg. Sleep",
      value: 0,
      unit: "h",
      target: 8,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "exercise",
      name: "Weekly Exercise",
      value: 0,
      unit: "min",
      target: 150,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "water",
      name: "Daily Water",
      value: 0,
      unit: "cups",
      target: 8,
      trend: 0,
      lastUpdated: null,
    },
    {
      id: "stress",
      name: "Stress Level",
      value: 0,
      unit: "1-10",
      target: 5,
      trend: 0,
      lastUpdated: null,
    },
  ],
};

// ── KPI Calculations ────────────────────────────────────────────────────────
export function calculateKPIStatus(kpi) {
  if (kpi.target === 0) return "neutral";
  const progress = (kpi.value / kpi.target) * 100;

  if (progress >= 100) return "success";
  if (progress >= 80) return "good";
  if (progress >= 50) return "warning";
  return "danger";
}

export function calculateTrend(current, previous) {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function getKPIColor(status) {
  const colors = {
    success: "#00c896",
    good: "#4ab3f4",
    warning: "#ff8c42",
    danger: "#ff4f5e",
    neutral: "#6aaedd",
  };
  return colors[status] || "#6aaedd";
}

// ── Web Sheet Data ──────────────────────────────────────────────────────────
export function createWebSheet(name, module, config = {}) {
  return {
    id: `sheet_${Date.now()}`,
    name,
    module,
    googleSheetsId: config.googleSheetsId || null,
    excelUrl: config.excelUrl || null,
    autoSync: config.autoSync || false,
    syncInterval: config.syncInterval || 3600000, // 1 hour
    columns: config.columns || [],
    rows: config.rows || [],
    lastSynced: null,
    createdAt: new Date().toISOString(),
  };
}

// ── Google Sheets Integration ───────────────────────────────────────────────
export function generateGoogleSheetsURL(sheetId) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}

export async function fetchGoogleSheetData(
  sheetId,
  sheetName = "Sheet1",
  range = "A1:Z1000",
) {
  try {
    // This would require Google Sheets API and OAuth
    // For now, returning mock structure for integration
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?key=YOUR_API_KEY`,
    );
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error("Failed to fetch Google Sheet:", error);
    return null;
  }
}

// ── Excel Integration ──────────────────────────────────────────────────────
export function generateExcelExport(kpis, module) {
  let csv = `KPI Module,${module}\nGenerated,${new Date().toISOString()}\n\n`;
  csv += `KPI Name,Current Value,Target,Status,Trend\n`;

  kpis.forEach((kpi) => {
    const status = calculateKPIStatus(kpi);
    csv += `${kpi.name},${kpi.value} ${kpi.unit},${kpi.target} ${kpi.unit},${status},${kpi.trend > 0 ? "↑" : "↓"} ${Math.abs(kpi.trend)}%\n`;
  });

  return csv;
}

export function downloadExcelCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ── Data Sync with Other Panels ────────────────────────────────────────────
export function syncKPIToPanel(kpiData, targetPanel) {
  // Sync KPI data to other panels
  const syncMap = {
    social: "socialPanel_analytics",
    health: "healthPanel_analytics",
    financial: "ceoGpsPanel_financials",
    website: "dashboardPanel_metrics",
  };

  const storageKey = syncMap[targetPanel];
  if (storageKey) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(kpiData));
      return true;
    } catch (e) {
      console.error("Failed to sync KPI:", e);
      return false;
    }
  }
  return false;
}

export function retrieveSyncedKPIs(sourcePanel) {
  const syncMap = {
    socialPanel: "socialPanel_analytics",
    healthPanel: "healthPanel_analytics",
    ceoGpsPanel: "ceoGpsPanel_financials",
    dashboardPanel: "dashboardPanel_metrics",
  };

  const storageKey = syncMap[sourcePanel];
  if (storageKey) {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to retrieve synced KPIs:", e);
      return null;
    }
  }
  return null;
}

// ── Historical Data Tracking ───────────────────────────────────────────────
export function trackKPIHistory(kpiId, value, timestamp = new Date()) {
  const historyKey = `kpi_history_${kpiId}`;
  let history = [];

  try {
    const stored = localStorage.getItem(historyKey);
    history = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn("Failed to load KPI history:", e);
  }

  history.push({
    value,
    timestamp: timestamp.toISOString(),
  });

  // Keep last 90 days of history
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  history = history.filter((h) => new Date(h.timestamp) > ninetyDaysAgo);

  try {
    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch (e) {
    console.warn("Failed to save KPI history:", e);
  }

  return history;
}

export function getKPIHistory(kpiId) {
  const historyKey = `kpi_history_${kpiId}`;
  try {
    const stored = localStorage.getItem(historyKey);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn("Failed to retrieve KPI history:", e);
    return [];
  }
}

// ── KPI Recommendations ────────────────────────────────────────────────────
export function generateKPIRecommendations(kpis) {
  const recommendations = [];

  kpis.forEach((kpi) => {
    const status = calculateKPIStatus(kpi);
    const progress = (kpi.value / kpi.target) * 100;

    if (status === "danger") {
      recommendations.push({
        level: "critical",
        kpi: kpi.name,
        message: `${kpi.name} is at ${progress.toFixed(0)}% of target. Immediate action needed.`,
      });
    } else if (status === "warning") {
      recommendations.push({
        level: "warning",
        kpi: kpi.name,
        message: `${kpi.name} needs attention. Current: ${progress.toFixed(0)}% of target.`,
      });
    }

    if (kpi.trend < -10) {
      recommendations.push({
        level: "warning",
        kpi: kpi.name,
        message: `${kpi.name} is trending down by ${Math.abs(kpi.trend)}%. Review recent changes.`,
      });
    }
  });

  return recommendations;
}
