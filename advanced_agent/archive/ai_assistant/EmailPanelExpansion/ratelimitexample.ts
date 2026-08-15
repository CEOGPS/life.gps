// Rate limiting example
import { rateLimit } from "lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(req: Request) {
  await limiter.check(req, 10); // 10 requests per minute
  // ... handler
}
