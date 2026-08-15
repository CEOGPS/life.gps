// app/api/cron/warmup/route.ts
export const runtime = "edge";
export const preferredRegion = "auto";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const scheduler = new WarmupScheduler();
  await scheduler.runDailyWarmup();

  return new Response("Warmup completed", { status: 200 });
}
