import { Octokit } from "octokit";

export async function createGist(
  authToken: string,
  description: string,
  files: { [filename: string]: { content: string } }
) {
  const octokit = new Octokit({ auth: authToken });

  try {
    const response = await octokit.request("POST /gists", {
      description,
      public: false,
      files,
    });

    return response.data;
  } catch (error) {
    console.error("Error creating gist:", error);
    throw error;
  }
}
