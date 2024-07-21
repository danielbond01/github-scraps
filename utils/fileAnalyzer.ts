import { info } from "console";
import { Issue, OctokitInstance, RepoInfo } from "../types/index.js";
import { extractIssues, syncIssues } from "../services/issue.js";

export async function analyzeFiles(
  { octokit }: OctokitInstance,
  repoInfo: RepoInfo
) {
  // Fetch the repository content
  const {
    data: { tree },
  } = await octokit.request("GET /repos/{owner}/{repo}/git/trees/HEAD", {
    owner: repoInfo.owner,
    repo: repoInfo.repo,
  });

  // Find ISSUEs and add to array
  var issues: Issue[] = [];
  for (const item of tree) {
    if (item.type === "blob") {
      const fileContent = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner: repoInfo.owner,
          repo: repoInfo.repo,
          path: item.path,
        }
      );

      const content = Buffer.from(fileContent.data.content, "base64").toString(
        "utf8"
      );

      issues = [...issues, ...extractIssues(repoInfo.owner, repoInfo.repo, repoInfo.sha, item.path, content)];
    }
  }

  info(
    `Found ${issues.length} issues in ${repoInfo.owner}/${repoInfo.repo}:`,
    issues.map((issue) => issue.title)
  );

  await syncIssues({ octokit }, repoInfo, issues);
}
