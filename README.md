# Github-Scraps

Github-Scraps is a GitHub App that allows you to automatically create issues directly from your codebase. It streamlines your workflow by enabling you to mark important code sections for later review or sharing without interrupting your coding process.

## Features

- Automatic issue creation from code comments using the [ISSUE] pattern
- Support for multiple comment types
- Seamless integration with GitHub repositories
- (COMING SOON) Keep track of similar or replicated code across your codebases using [SCRAPS] which you can copy and paste into your new projects

## Installation

1. Go to [GitHub Apps - Scraps by ProjectLab](https://github.com/apps/scraps-by-projectlab) (replace with actual link)
2. Click on "Install"
3. Choose the repository or repositories where you want to install Github-Scraps
4. Authorize the app

## Usage

### Creating Issues

Say you want to come back and refactor this 'add' function later. You can add a comment in your code like this:

```
// [ISSUE] Refactor this function
function add(x: number, y: number) {
  return x+y;
}
```

When you push your code, Github-Scraps will automatically create an issue with:

- The comment text as the issue title, in this case 'Refactor your function in <filename>'
- The surrounding code
- A permalink to the line of code

### Creating Scraps (Coming Soon)

When added, you'll be able to use Github-Scraps to keep track of bits of code you use in multiple places. For example, let's say you write a login function for project1. You can wrap it in a SCRAP like

```
// [SCRAP] My Auth Implementation
function login(user: User) {
  loginUser(user);
}
// [SCRAP]
```

Github-Scraps will create a record of this code for you, viewable on (ProjectLab)[https://www.projectlab.space] with the description 'My Auth Implementation'. The content between the [SCRAP] tags will be included in the recorded code snippet. You can then copy this into another project2. Wrapping this in a SCRAP will also add this file to the same set of records. If any of these implmementations are changed, the UI in ProjectLab will be updated and you'll be able to compare implementations across repositories and, of course, copy and paste into any new projects.

### Getting Started for Contributors

This project is very much in its early stages, and contributions are very welcome if you'd like to help grow Github-Scraps!

1. Clone the repository:

```
git clone https://github.com/danielbond01/github-scraps
```

2. Install dependencies:

```
npm install
```

3. Set up your development environment:

- Ensure you have Node.js installed
- Set up a GitHub App for testing (see GitHub's documentation)
- Configure your .env file with necessary secrets

4. Run the development server:
   npm run dev
5. Test your changes locally using tools like smee.io to forward webhook payloads to your local environment.
6. Submit a pull request with your changes.

This is a typescript project designed to run on vercel serverless.

### License

This project is licensed under the MIT License.

### Support

If you encounter any problems or have any questions, please open an issue in this repository.
