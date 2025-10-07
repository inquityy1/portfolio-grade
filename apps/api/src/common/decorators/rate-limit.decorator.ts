import { SetMetadata } from '@nestjs/common';

export type RateLimitConfig = {
  perUser?: { limit: number; windowSec: number };
  perOrg?: { limit: number; windowSec: number };
  perIp?: { limit: number; windowSec: number };
};

export const RATE_LIMIT_KEY = 'rate_limit_config';
export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);
