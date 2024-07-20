import { info } from "console";
import { Issue, OctokitInstance, RepoInfo } from "../types/index.js";
import { extractIssues, syncIssues } from "../services/issue.js";

export async function analyzeFiles(
  { octokit }: OctokitInstance,
  { owner, repo }: RepoInfo
) {
  // Fetch the repository content
  const {
    data: { tree },
  } = await octokit.request("GET /repos/{owner}/{repo}/git/trees/HEAD", {
    owner,
    repo,
  });

  // Find ISSUEs and add to array
  var issues: Issue[] = [];
  for (const item of tree) {
    if (item.type === "blob") {
      const fileContent = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path: item.path,
        }
      );

      const content = Buffer.from(fileContent.data.content, "base64").toString(
        "utf8"
      );

      issues = [...issues, ...extractIssues(content)];
    }
  }

  info(
    `Found ${issues.length} issues in ${owner}/${repo}:`,
    issues.map((issue) => issue.title)
  );

  await syncIssues({ octokit }, { owner, repo }, issues);
}
