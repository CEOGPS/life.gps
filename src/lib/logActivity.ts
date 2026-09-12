export async function logActivity(type: string, source: string, message: string) {
  console.log(`[${type.toUpperCase()}] ${source}: ${message}`);
  // Could persist to Supabase or send to worker
}