import { OctokitInstance, RepoInfo } from "../types";

export async function createIssue(
  { octokit }: OctokitInstance,
  { owner, repo }: RepoInfo,
  title: string,
  body: string
) {
  try {
    const response = await octokit.request(
      "POST /repos/{owner}/{repo}/issues",
      {
        owner,
        repo,
        title,
        body,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error creating issue:", error);
    throw error;
  }
}
