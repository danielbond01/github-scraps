export interface RepoInfo {
  owner: string;
  repo: string;
  sha: string;
}

export interface OctokitInstance {
  octokit: any;
}

export interface Issue {
  title: string;
  body: string;
}

export interface Gist {
  id?: string;
  owner: string;
  description: string;
  files: GistFile[];
}

export interface GistFile {
  filename: string;
  content: string;
}
