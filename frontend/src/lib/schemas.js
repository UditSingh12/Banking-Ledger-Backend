import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

export const createAccountSchema = z.object({
  accountType: z.enum(['SAVINGS', 'CURRENT'], {
    required_error: 'Please select an account type',
    invalid_type_error: 'Account type must be SAVINGS or CURRENT',
  }),
});

export const transferSchema = z.object({
  fromAccount: z.string().min(1, 'Source account is required'),
  toAccount: z.string().min(24, 'Please enter a valid account ID').max(24, 'Please enter a valid account ID'),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .max(10_000_000, 'Amount exceeds maximum transfer limit'),
});

export const accountStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'FROZEN', 'CLOSED']),
});

export const reversalSchema = z.object({
  reason: z
    .string()
    .min(3, 'Please provide a reason (at least 3 characters)')
    .max(500, 'Reason is too long'),
});
