import * as Joi from 'joi';

/**
 * Joi schema для валідації environment variables
 * Забезпечує fail-fast підхід - додаток не запуститься без необхідних змінних
 */
export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APPLICATION_PORT: Joi.number().port().default(4000),
  APPLICATION_URL: Joi.string().uri().required(),
  ALLOWED_ORIGIN: Joi.string().uri().required(),

  // JWT Authentication
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Database
  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_NAME: Joi.string().required(),

  // External APIs (optional)
  GOOGLE_BOOKS_API_KEY: Joi.string().optional().allow(''),
  TMDB_API_KEY: Joi.string().optional().allow(''),
});
