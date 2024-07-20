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
  console.log("Recieved push for repo", payload.repository.name)
  const owner = payload.repository.owner?.login;
  const repo = payload.repository.name;
  owner && await listRepoFiles(owner, repo, octokit);
});

const middleware = createNodeMiddleware(app.webhooks);

// Vercel API handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Log the user agent of the incoming request
  console.log("Recieved request from:", req.headers['user-agent'])
  // Use Octokit's middleware to handle the webhook
  const middleware = createNodeMiddleware(app.webhooks);
  // Call the middleware with the request and response objects
  middleware(req, res, (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(200).json({ success: true });
    }
  });
}
