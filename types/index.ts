export interface RepoInfo {
  owner: string;
  repo: string;
}

export interface OctokitInstance {
  octokit: any;
}

export interface Issue {
  title: string;
  body: string
}
