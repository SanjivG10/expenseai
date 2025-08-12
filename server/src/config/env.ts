import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  API_VERSION: z.string().default('v1'),

  // Supabase
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // OpenAI (optional)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4-vision-preview'),

  // Security
  BCRYPT_ROUNDS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('12'),
  RATE_LIMIT_MAX: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),
  RATE_LIMIT_WINDOW: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('900000'),

  // Upload
  MAX_FILE_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe API key is required'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validate and parse environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Failed to parse environment variables:', error);
    }
    process.exit(1);
  }
};

export const env = parseEnv();

export default env;
