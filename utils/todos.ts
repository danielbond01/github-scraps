import { Issue } from "../types/index.js";

export function extractTodos(content: string): Issue[] {
  const lines = content.split("\n");
  const todos: Issue[] = [];
  const todoRegex = /todo[\s:,-]*\s*(.*)/i;

  lines.forEach((line, index) => {
    const match = todoRegex.exec(line);
    if (match) {
      // Get title from match
      const title = match[1].trim();
      const bodyLines = [];

      // Check if the next line is a body line
      if (title.endsWith(":") && lines.length > index + 1) {
        bodyLines.push(lines[index + 1].trim());
        bodyLines.push("\n\n");
      }

      // Add next 20 lines as body
      bodyLines.push("```");
      while (bodyLines.length < 20 && lines.length > index + 1) {
        bodyLines.push(lines[index + 1]);
      }
      bodyLines.push("```");

      todos.push({
        title: title,
        body: bodyLines.join("\n"),
      });
    }
  });

  return todos;
}
