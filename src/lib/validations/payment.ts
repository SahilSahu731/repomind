import { z } from "zod";

export const createOrderSchema = z.object({
  plan: z.enum(["per_repo", "pro_monthly", "pro_yearly"]),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;
