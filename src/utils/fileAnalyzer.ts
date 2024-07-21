import { info } from "console";
import { Issue, Gist, OctokitInstance, RepoInfo } from "../types/index.js";
import { extractIssues, syncIssues } from "../services/issue.js";
import { extractGists, syncGists } from "../services/gist.js";

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

  // Find ISSUEs and GISTs and add to arrays
  var issues: Issue[] = [];
  var gists: Gist[] = [];
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

      issues = [
        ...issues,
        ...extractIssues(
          repoInfo.owner,
          repoInfo.repo,
          repoInfo.sha,
          item.path,
          content
        ),
      ];
      gists = [
        ...gists,
        ...extractGists(
          repoInfo.owner,
          repoInfo.repo,
          repoInfo.sha,
          item.path,
          content
        ),
      ];
    }
  }

  info(
    `Found ${issues.length} issues in ${repoInfo.owner}/${repoInfo.repo}:`,
    issues.map((issue) => issue.title)
  );

  info(
    `Found ${gists.length} gists in ${repoInfo.owner}/${repoInfo.repo}:`,
    gists.map((gist) => gist.description)
  );

  await syncIssues({ octokit }, repoInfo, issues);

  const response = await octokit.rest.gists.list();
  console.log(response.data);
}
