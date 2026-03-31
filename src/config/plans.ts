export const PLANS = {
  per_repo: {
    name: "Per Repo",
    amount: 9900,
    currency: "INR",
    type: "ONE_TIME" as const,
    credits: 1,
  },
  pro_monthly: {
    name: "Pro Monthly",
    amount: 29900,
    currency: "INR",
    type: "SUBSCRIPTION" as const,
    interval: "monthly" as const,
  },
  pro_yearly: {
    name: "Pro Yearly",
    amount: 249900,
    currency: "INR",
    type: "SUBSCRIPTION" as const,
    interval: "yearly" as const,
  },
} as const;
