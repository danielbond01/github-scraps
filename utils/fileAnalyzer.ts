import { info } from "console";
import { Issue, OctokitInstance, RepoInfo } from "../types/index.js";
import { extractTodos } from "./todos.js";
import { syncIssues } from "../services/issue.js";

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

  // Find TODOs and add to array
  var todos: Issue[] = [];
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

      todos = [...todos, ...extractTodos(content)];
    }
  }

  info(`Found ${todos.length} todos in ${owner}/${repo}`);

  syncIssues({ octokit }, { owner, repo }, todos);
}
