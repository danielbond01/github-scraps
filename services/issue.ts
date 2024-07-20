import { info } from "console";
import { Issue, OctokitInstance, RepoInfo } from "../types/index.js";

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
  todos: Issue[]
) {
  const existingIssues = await getIssues(octokit, { owner, repo });

  const existingTitles = existingIssues.map((issue) => issue.title);
  const newIssues = todos.filter(
    (todo) => !existingTitles.includes(todo.title)
  );

  for (const issue of newIssues) {
    info(`Creating issue: ${issue.title}`);
    await createIssue(octokit, { owner, repo }, issue.title, issue.body);
  }
}
