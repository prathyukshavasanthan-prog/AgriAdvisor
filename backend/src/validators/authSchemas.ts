import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone_number: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 characters')
    .max(15, 'Phone number must not exceed 15 characters')
    .regex(/^[0-9+ \-]+$/, 'Phone number must contain only digits, +, - or spaces'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferred_language: z
    .enum(['ta', 'en', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'])
    .optional()
    .default('en'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const loginSchema = z.object({
  phone_number: z.string().trim().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateLanguageSchema = z.object({
  preferred_language: z.enum(['ta', 'en', 'hi', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa']),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
