import { z } from "zod";

export const requestAccessSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(6),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  // File uploads are handled separately (multipart → object storage); URLs land here.
  aadhaarUrl: z.string().url(),
  gstUrl: z.string().url().optional(),
});

export const otpSendSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["SIGNUP", "LOGIN"]).default("SIGNUP"),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["SIGNUP", "LOGIN"]).default("SIGNUP"),
  code: z.string().length(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const stoneQuerySchema = z.object({
  shape: z.string().optional(),
  color: z.string().optional(),
  clarity: z.string().optional(),
  caratMin: z.coerce.number().optional(),
  caratMax: z.coerce.number().optional(),
  status: z.enum(["AVAILABLE", "HOLD", "MEMO", "SOLD"]).optional(),
  take: z.coerce.number().min(1).max(200).default(60),
  skip: z.coerce.number().min(0).default(0),
});

export const cartMutateSchema = z.object({ stoneId: z.string().min(1) });

export const tradeRequestSchema = z.object({
  stoneId: z.string().min(1),
  kind: z.enum(["MEMO", "HOLD"]),
  days: z.number().int().positive().optional(),
  hours: z.number().int().positive().optional(),
  note: z.string().optional(),
});

export const assignSchema = z.object({ salespersonId: z.string().min(1) });
