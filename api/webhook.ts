import { VercelRequest, VercelResponse } from "@vercel/node";
import { createNodeMiddleware } from "@octokit/webhooks";
import { app } from "../services/github.js";
import { analyzeFiles } from "../utils/fileAnalyzer.js";

// Handle push events
app.webhooks.on("push", async ({ octokit, payload }) => {
  console.log("Received push for repo", payload.repository.name);
  const owner = payload.repository.owner?.login;
  if (owner) {
    await analyzeFiles({ octokit }, { 
      owner, 
      repo: payload.repository.name,
      sha: payload.after
    });
  }
});

// This logs any errors that occur.
app.webhooks.onError((error) => {
  console.error(`Error processing request: ${error.event}`);
});

// Vercel API handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Use Octokit's middleware to handle the webhook
  const middleware = createNodeMiddleware(app.webhooks, {
    path: "/api/webhook",
    log: undefined
  });

  // Directly handle the request and response with the middleware
  const success = middleware(req, res)
    .then(() => {
      console.log("Call finished successfully");
    })
    .catch((error) => {
      console.error("Middleware error:", error);
      res.status(500).send(error.message);
    });

  console.log("Middleware processing started", success);
}
