import { OctokitInstance, RepoInfo } from "../types/index.js";
import { createGist } from "../services/gist.js";
import { createIssue } from "../services/issue.js";

export async function analyzeFilesForKeywords(
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
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        if (line.includes("// Todo")) {
          createIssue(
            { octokit },
            { owner, repo },
            "Todo found",
            `Found Todo at ${item.path}:${index + 1}`
          );
        } else if (line.includes("// Gist")) {
          const [_, gistName] = line.split(" - ");
          createGist(octokit.auth.token, `Gist: ${gistName}`, {
            [gistName]: { content: lines.slice(index + 1).join("\n") },
          });
        }
      });
    }
  }
}
