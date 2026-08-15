// app/api/health/route.ts
export async function GET() {
  // Check database connection
  const { data, error } = await supabase
    .from("contacts")
    .select("count", { count: "exact", head: true });

  // Check email provider
  const emailStatus = await checkEmailProviders();

  return Response.json({
    status: "healthy",
    database: !error,
    emailProviders: emailStatus,
    timestamp: new Date().toISOString(),
  });
}
