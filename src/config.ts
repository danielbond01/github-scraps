import dotenv from "dotenv";

dotenv.config();

export const config = {
  appId: process.env.APP_ID!,
  webhookSecret: process.env.WEBHOOK_SECRET!,
  privateKey: process.env.PRIVATE_KEY!,
};
