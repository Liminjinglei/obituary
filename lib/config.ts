export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const EXPIRE_DAYS = Number(process.env.NOTICE_EXPIRE_DAYS || "30");
export const RATE_LIMIT_PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR || "5");
