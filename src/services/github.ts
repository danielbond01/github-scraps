import { App } from "octokit";
import { config } from "../config.js";

export const app = new App({
  appId: config.appId,
  privateKey: config.privateKey,
  webhooks: {
    secret: config.webhookSecret,
  },
  clientId: config.clientId,
  clientSecret: config.clientSecret,
});
