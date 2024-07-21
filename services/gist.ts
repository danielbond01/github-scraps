// gist.ts

import { Gist, GistFile, OctokitInstance, RepoInfo } from "../types/index.js";

export function extractGists(
  owner: string,
  repo: string,
  sha: string,
  file: string,
  content: string
): Gist[] {
  const lines = content.split("\n");
  const gists: Gist[] = [];
  const gistRegex = /\[GIST\]\s*(.*?)\s*(?:\[(.*?)\])?\s*(?:\[(.*?)\])?/;

  let currentGist: Gist | null = null;
  let currentFile: GistFile | null = null;
  let fileContent: string[] = [];

  lines.forEach((line, index) => {
    const match = gistRegex.exec(line);
    if (match) {
      if (currentGist && currentFile) {
        currentFile.content = fileContent.join("\n");
        currentGist.files.push(currentFile);
        fileContent = [];
      }

      const [, description, username, filename] = match;
      if (!currentGist || currentGist.description !== description) {
        if (currentGist) {
          gists.push(currentGist);
        }
        currentGist = {
          owner: username ? username.trim() : owner,
          description: description.trim(),
          files: [],
        };
      }
      currentFile = {
        filename: filename
          ? filename.trim()
          : `${repo}/${file.split("/").pop() || ""}`,
        content: "",
      };
    } else if (currentFile && line.trim() !== "[GIST]") {
      fileContent.push(line);
    } else if (line.trim() === "[GIST]" && currentGist && currentFile) {
      currentFile.content = fileContent.join("\n");
      currentGist.files.push(currentFile);
      currentFile = null;
      fileContent = [];
    }
  });

  return gists;
}

async function getGists(
  { octokit }: OctokitInstance,
  owner: string
): Promise<Gist[]> {
  try {
    const response = (await octokit.rest.gists.list({ owner })) as {
      data: {
        id: string;
        owner: { login: string };
        description: string;
        files: Record<string, { raw_url: string }>;
      }[];
    };
    const gists: Gist[] = [];

    for (const gist of response.data) {
      const files: GistFile[] = [];

      for (const [filename, file] of Object.entries(gist.files || {})) {
        if (file && file.raw_url) {
          const contentResponse = await octokit.request("GET " + file.raw_url);
          files.push({
            filename,
            content: contentResponse.data,
          });
        }
      }

      gists.push({
        id: gist.id,
        owner: owner,
        description: gist.description || "",
        files,
      });
    }

    return gists;
  } catch (error) {
    console.error("Error getting gists:", error);
    throw error;
  }
}

async function createGist({ octokit }: OctokitInstance, gist: Gist) {
  try {
    const files: Record<string, { content: string }> = {};
    gist.files.forEach((file) => {
      files[file.filename] = { content: file.content };
    });

    const response = await octokit.rest.gists.create({
      description: gist.description,
      public: false,
      files,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating gist:", error);
    throw error;
  }
}

async function updateGist(
  { octokit }: OctokitInstance,
  gistId: string,
  gist: Gist
) {
  try {
    const files: Record<string, { content: string } | null> = {};
    gist.files.forEach((file) => {
      files[file.filename] = { content: file.content };
    });

    await octokit.rest.gists.update({
      gist_id: gistId,
      description: gist.description,
      files,
    });
  } catch (error) {
    console.error("Error updating gist:", error);
    throw error;
  }
}

function gistsAreEqual(gist1: Gist, gist2: Gist): boolean {
  if (gist1.description !== gist2.description) return false;
  if (gist1.files.length !== gist2.files.length) return false;
  
  for (const file1 of gist1.files) {
    const file2 = gist2.files.find(f => f.filename === file1.filename);
    if (!file2 || file1.content !== file2.content) {
      return false;
    }
  }
  
  return true;
}

export async function syncGists(
  octokit: OctokitInstance,
  repoInfo: RepoInfo,
  gists: Gist[]
) {
  const existingGists = await getGists(octokit, repoInfo.owner);

  for (const gist of gists) {
    if (gist.owner !== repoInfo.owner) {
      console.log(`Skipping gist for user ${gist.owner} (not repo owner)`);
      continue;
    }

    const existingGist = existingGists.find(
      (g) => g.description === gist.description
    );

    if (existingGist) {
      if (!gistsAreEqual(gist, existingGist)) {
        console.log(`Updating existing gist: ${gist.description}`);
        await updateGist(octokit, existingGist.id!, gist);
      } else {
        console.log(`Gist unchanged, skipping update: ${gist.description}`);
      }
    } else {
      console.log(`Creating new gist: ${gist.description}`);
      await createGist(octokit, gist);
    }
  }
}
