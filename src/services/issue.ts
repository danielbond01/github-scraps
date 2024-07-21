import { info } from "console";
import { Issue, OctokitInstance, RepoInfo } from "../types/index.js";

export function extractIssues(
  owner: string,
  repo: string,
  sha: string,
  file: string,
  content: string
): Issue[] {
  const lines = content.split("\n");
  const issues: Issue[] = [];
  const issueRegex = /\[ISSUE\]\s*(.*)/;

  // This regex matches most common comment styles
  const commentRegex =
    /^(?:\/\/|#|;|--|\/\*|\*\s?|'''|"""|rem\b|\(\*|{-|\(\*)/i;

  const friendlyFile = file.split("/").reverse()[0];

  let inMultiLineComment = false;
  let multiLineCommentEnd: RegExp | null = null;

  lines.forEach((line, index) => {
    try {
      // Check for multi-line comment start
      if (!inMultiLineComment) {
        if (line.trim().startsWith("/*")) {
          inMultiLineComment = true;
          multiLineCommentEnd = /\*\//;
        } else if (
          line.trim().startsWith("'''") ||
          line.trim().startsWith('"""')
        ) {
          inMultiLineComment = true;
          multiLineCommentEnd = new RegExp(line.trim().slice(0, 3));
        } else if (line.trim().startsWith("{-")) {
          inMultiLineComment = true;
          multiLineCommentEnd = /-}/;
        } else if (line.trim().startsWith("(*")) {
          inMultiLineComment = true;
          multiLineCommentEnd = /\*\)/;
        }
      }

      // Check for multi-line comment end
      if (
        inMultiLineComment &&
        multiLineCommentEnd &&
        multiLineCommentEnd.test(line)
      ) {
        inMultiLineComment = false;
        multiLineCommentEnd = null;
      }

      const isComment = inMultiLineComment || commentRegex.test(line.trim());

      if (isComment) {
        const match = issueRegex.exec(line);
        if (match) {
          const title = `${match[1].trim()} in ${friendlyFile}`;
          const bodyLines = [
            `${owner} created an issue in ${friendlyFile} on line ${
              index + 1
            }\n`,
          ];

          const codeSnippet = lines
            .slice(Math.max(0, index - 5), Math.min(lines.length, index + 16))
            .map((line) => line.trimEnd()) // Preserve leading whitespace, trim trailing
            .filter(
              (line, idx, arr) =>
                line.trim() !== "" || (idx > 0 && idx < arr.length - 1)
            );

          if (codeSnippet.length > 0) {
            bodyLines.push("```");
            bodyLines.push(...codeSnippet);
            bodyLines.push("```");
          }

          const permalink = `https://github.com/${owner}/${repo}/blob/${sha}/${file}#L${
            index + 1
          }`;
          bodyLines.push(`\nPermalink:\n ${permalink}`);

          issues.push({
            title: title,
            body: bodyLines.join("\n"),
          });
        }
      }
    } catch (error) {
      console.error(`Error processing line ${index + 1} in ${file}:`, error);
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

  info(
    `Found ${existingIssues.length} existing issues in ${repoInfo.owner}/${repoInfo.repo}:`,
    existingIssues.map((issue) => issue.title)
  );

  const existingTitles = existingIssues.map((issue) => issue.title);
  const newIssues = issues.filter(
    (issue) => !existingTitles.includes(issue.title)
  );

  info(
    `Creating ${newIssues.length} new issues in ${repoInfo.owner}/${repoInfo.repo}`
  );

  for (const issue of newIssues) {
    info(`Creating issue: ${issue.title}`);
    await createIssue(octokit, repoInfo, issue.title, issue.body);
  }
}
