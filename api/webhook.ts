import { VercelRequest, VercelResponse } from '@vercel/node';
import { App } from 'octokit';
import { createNodeMiddleware } from '@octokit/webhooks';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Assign environment variables
const appId = process.env.APP_ID!;
const webhookSecret = process.env.WEBHOOK_SECRET!;
const privateKey = process.env.PRIVATE_KEY!;

// Create an instance of Octokit App
const app = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: {
    secret: webhookSecret,
  },
});

// Function to list filenames in the repository
async function listRepoFiles(owner: string, repo: string, octokit: any) {
  try {
    const { data: { tree } } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
      owner: owner,
      repo: repo,
      tree_sha: 'HEAD', // Use 'HEAD' to get the latest commit's tree
    });

    const filenames = tree.map((item: any) => item.path);
    console.log('Files in the repository:', filenames);
  } catch (error) {
    console.error('Error fetching repository contents:', error);
  }
}

// Handle push events
app.webhooks.on('push', async ({ octokit, payload }) => {
  console.log("Received push for repo", payload.repository.name);
  const owner = payload.repository.owner?.login;
  if (owner) {
    const repo = payload.repository.name;
    await listRepoFiles(owner, repo, octokit);
  }
});

// This logs any errors that occur.
app.webhooks.onError((error) => {
  console.error(`Error processing request: ${error.event}`);
});

// Vercel API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log the user agent of the incoming request
  console.log("Received request from:", req.headers['user-agent']);
  
  // Use Octokit's middleware to handle the webhook
  const middleware = createNodeMiddleware(app.webhooks, {path: "/api/webhook"});
  
  // Directly handle the request and response with the middleware
  const success = await middleware(req, res)
  
  console.log("Call finished, success", success)
}
