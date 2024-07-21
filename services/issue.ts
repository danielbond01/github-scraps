import { info } from "console";
import { Issue, OctokitInstance, RepoInfo } from "../types/index.js";

export function extractIssues(owner: string, repo: string, sha: string, file: string, content: string): Issue[] {
  const lines = content.split("\n");
  const issues: Issue[] = [];
  const issueRegex = /\[ISSUE\]\s*(.*)/;
  const commentRegex = /^[#\/\*]\s*(.*)$/;

  const friendlyFile = file.split("/").reverse()[0];

  lines.forEach((line, index) => {
    const match = issueRegex.exec(line);
    if (match) {
      // Get title from match
      const title = `${match[1].trim()} in ${friendlyFile}`;
      const bodyLines = [];

      // Check if the next line is a body line
      if (title.endsWith(":") && lines.length > index + 1) {
        const bodyLine = lines[index + 1].trim().replace(commentRegex, '$1');
        bodyLines.push(`${owner} created an issue in ${friendlyFile} on line ${index + 1} - ${bodyLine}\n`);
      } else {
        bodyLines.push(`${owner} created an issue in ${friendlyFile} on line ${index + 1}\n`);
      }

      // Add up to the last 5 lines
      const precedingCodeLines = [];
      for (let i = Math.max(0, index - 5); i < index; i++) {
        precedingCodeLines.push(lines[i]);
      }

      // Add next 15 lines
      const followingCodeLines = [];
      for (let i = 0; i <= 15 && lines.length > index + i; i++) {
        followingCodeLines.push(lines[index + i]);
      }

      // Combine preceding and following lines, removing leading and trailing empty lines
      const combinedCodeLines = [...precedingCodeLines, ...followingCodeLines].filter((line, idx, arr) => {
        return line.trim() !== "" || (idx > 0 && idx < arr.length - 1);
      });
      
      if (combinedCodeLines.length > 0) {
        bodyLines.push("```");
        bodyLines.push(...combinedCodeLines);
        bodyLines.push("```");
      }

      // Add permalink
      const permalink = `https://github.com/${owner}/${repo}/blob/${sha}/${file}#L${index + 1}`;
      bodyLines.push(`\nPermalink:\n ${permalink}`);

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
  repoInfo: RepoInfo,
  issues: Issue[]
) {
  const existingIssues = await getIssues(octokit, repoInfo);

  info(`Found ${existingIssues.length} existing issues in ${repoInfo.owner}/${repoInfo.repo}:`, existingIssues.map((issue) => issue.title));

  const existingTitles = existingIssues.map((issue) => issue.title);
  const newIssues = issues.filter(
    (issue) => !existingTitles.includes(issue.title)
  );

  info(`Creating ${newIssues.length} new issues in ${repoInfo.owner}/${repoInfo.repo}`);

  for (const issue of newIssues) {
    info(`Creating issue: ${issue.title}`);
    await createIssue(octokit, repoInfo, issue.title, issue.body);
  }
}
