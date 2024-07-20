import { info } from "console";
import { Issue, OctokitInstance, RepoInfo } from "../types/index.js";

export function extractIssues(content: string): Issue[] {
  const lines = content.split("\n");
  const issues: Issue[] = [];
  const issueRegex = /\[ISSUE\]\s*(.*)/;

  lines.forEach((line, index) => {
    const match = issueRegex.exec(line);
    if (match) {
      // Get title from match
      const title = match[1].trim();
      const bodyLines = [];

      // Check if the next line is a body line
      if (title.endsWith(":") && lines.length > index + 1) {
        bodyLines.push(lines[index + 1].trim());
        bodyLines.push("\n\n");
      }

      // Add next 20 lines as body
      bodyLines.push("```");
      while (bodyLines.length < 20 && lines.length > index + 1) {
        bodyLines.push(lines[index + 1]);
      }
      bodyLines.push("```");

      issues.push({
        title: title,
        body: bodyLines.join("\n"),
      });
    }
  });

  return issues;
}

async function getIssues(
  { octokit }: OctokitInstance,
  { owner, repo }: RepoInfo
): Promise<Issue[]> {
  try {
    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
    });

    return response.data;
  } catch (error) {
    console.error("Error getting issues:", error);
    throw error;
  }
}

async function createIssue(
  { octokit }: OctokitInstance,
  { owner, repo }: RepoInfo,
  title: string,
  body: string
) {
  try {
    await octokit.request("POST /repos/{owner}/{repo}/issues", {
      owner,
      repo,
      title,
      body,
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    throw error;
  }
}

export async function syncIssues(
  octokit: OctokitInstance,
  { owner, repo }: RepoInfo,
  issues: Issue[]
) {
  const existingIssues = await getIssues(octokit, { owner, repo });

  info(`Found ${existingIssues.length} existing issues in ${owner}/${repo}`);

  const existingTitles = existingIssues.map((issue) => issue.title);
  const newIssues = issues.filter(
    (issue) => !existingTitles.includes(issue.title)
  );

  info(`Creating ${newIssues.length} new issues in ${owner}/${repo}`);

  for (const issue of newIssues) {
    info(`Creating issue: ${issue.title}`);
    await createIssue(octokit, { owner, repo }, issue.title, issue.body);
  }
}
