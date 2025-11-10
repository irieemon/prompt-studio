import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash Redis is configured
// Trim whitespace/newlines from environment variables
const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const isRedisConfigured = redisUrl && redisToken;

let rateLimit: Ratelimit | null = null;

if (isRedisConfigured) {
  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  rateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
    analytics: true,
    prefix: '@prompt-studio/copyright-check',
  });
}

/**
 * Rate limiter for copyright checks
 * Returns { success: boolean } indicating if request is allowed
 */
export async function checkRateLimit(
  identifier: string = 'global'
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  // If Redis is not configured, allow all requests (for development/MVP)
  if (!rateLimit) {
    console.warn('Rate limiting not configured. Allowing request.');
    return { success: true };
  }

  try {
    const { success, limit, remaining, reset } = await rateLimit.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request to proceed
    return { success: true };
  }
}

/**
 * Get the client IP address from request headers
 */
export function getClientIp(req: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier
  return 'unknown';
}
