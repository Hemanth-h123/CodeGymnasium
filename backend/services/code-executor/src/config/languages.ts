export const LANGUAGE_SUPPORT = {
  javascript: {
    name: 'JavaScript (Node.js)',
    filename: 'solution.js',
    command: 'node',
    timeout: 5000,
    template: `function solution() {\n  return "Hello, World!";\n}\n\nconsole.log(solution());`
  },
  c: {
    name: 'C',
    filename: 'solution.c',
    compile: 'gcc',
    command: './solution',
    timeout: 5000,
    template: `#include <stdio.h>\nint main(){\n    printf("Hello, World!\\n");\n    return 0;\n}`
  },
  html: {
    name: 'HTML',
    filename: 'index.html',
    command: 'print',
    timeout: 3000,
    template: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Hello</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>`
  },
  css: {
    name: 'CSS',
    filename: 'styles.css',
    command: 'print',
    timeout: 3000,
    template: `/* Hello, World! */\nbody {\n  font-family: sans-serif;\n  color: #222;\n}`
  },
  python: {
    name: 'Python',
    filename: 'solution.py',
    command: 'python',
    timeout: 5000,
    template: `def solution():\n    return "Hello, World!"\n\nprint(solution())`
  },
  sql: {
    name: 'SQL (SQLite)',
    filename: 'solution.sql',
    command: 'sqlite3',
    timeout: 5000,
    template: `CREATE TABLE IF NOT EXISTS hello(msg TEXT);\nDELETE FROM hello;\nINSERT INTO hello VALUES ('Hello, World!');\n.headers off\n.mode list\nSELECT msg FROM hello;`
  },
  typescript: {
    name: 'TypeScript',
    filename: 'solution.ts',
    command: 'npx ts-node',
    timeout: 8000,
    template: `function solution(): string {\n  return "Hello, World!";\n}\n\nconsole.log(solution());`
  },
    java: {
    name: 'Java',
    filename: 'Solution.java',
    compile: 'javac',
    command: 'java',
    timeout: 8000,
    template: `public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
  },
  cpp: {
    name: 'C++',
    filename: 'solution.cpp',
    compile: 'g++',
    command: './solution',
    timeout: 5000,
    template: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`
  },
  go: {
    name: 'Go',
    filename: 'solution.go',
    command: 'go run',
    timeout: 8000,
    template: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`
  },
  rust: {
    name: 'Rust',
    filename: 'solution.rs',
    compile: 'rustc',
    command: './solution',
    timeout: 10000,
    template: `fn main() {\n    println!("Hello, World!");\n}`
  },
  csharp: {
    name: 'C#',
    filename: 'Solution.cs',
    compile: 'mcs',
    command: 'mono',
    timeout: 5000,
    template: `using System;\n\nclass Solution {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`
  }
};

export type SupportedLanguage = keyof typeof LANGUAGE_SUPPORT;
