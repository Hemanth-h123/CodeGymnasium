export const LANGUAGE_SUPPORT = {
  javascript: {
    name: 'JavaScript (Node.js)',
    filename: 'solution.js',
    command: 'node',
    timeout: 5000,
    template: `function solution() {
  return "Hello, World!";
}

console.log(solution());`
  },
  c: {
    name: 'C',
    filename: 'solution.c',
    compile: 'gcc',
    command: './solution',
    timeout: 5000,
    template: `#include <stdio.h>
int main(){
  printf("Hello, World!\\n");
  return 0;
}`
  },
  html: {
    name: 'HTML',
    filename: 'index.html',
    command: 'print',
    timeout: 3000,
    template: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hello</title>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>`
  },
  css: {
    name: 'CSS',
    filename: 'styles.css',
    command: 'print',
    timeout: 3000,
    template: `/* Hello, World! */
body {
  font-family: sans-serif;
  color: #222;
}`
  },
  python: {
    name: 'Python',
    filename: 'solution.py',
    command: 'python',
    timeout: 5000,
    template: `def solution():
    return "Hello, World!"

print(solution())`
  },
  sql: {
    name: 'SQL (SQLite)',
    filename: 'solution.sql',
    command: 'sqlite3',
    timeout: 5000,
    template: `CREATE TABLE hello(msg TEXT);
INSERT INTO hello VALUES ('Hello, World!');
SELECT * FROM hello;`
  },
  typescript: {
    name: 'TypeScript',
    filename: 'solution.ts',
    command: 'npx ts-node',
    timeout: 8000,
    template: `function solution(): string {
  return "Hello, World!";
}

console.log(solution());`
  },
  java: {
    name: 'Java',
    filename: 'Solution.java',
    compile: 'javac',
    command: 'java',
    timeout: 8000,
    template: `public class Solution {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}`
  },
  cpp: {
    name: 'C++',
    filename: 'solution.cpp',
    compile: 'g++',
    command: './solution',
    timeout: 5000,
    template: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello, World!" << endl;
  return 0;
}`
  },
  go: {
    name: 'Go',
    filename: 'solution.go',
    command: 'go run',
    timeout: 8000,
    template: `package main
import "fmt"

func main() {
  fmt.Println("Hello, World!")
}`
  },
  rust: {
    name: 'Rust',
    filename: 'solution.rs',
    compile: 'rustc',
    command: './solution',
    timeout: 10000,
    template: `fn main() {
  println!("Hello, World!");
}`
  },
  csharp: {
    name: 'C#',
    filename: 'Solution.cs',
    compile: 'mcs',
    command: 'mono',
    timeout: 5000,
    template: `using System;
using System.Collections.Generic;

class Solution {
  static void Main() {
    Console.WriteLine("Hello, World!");
  }
}`
  },
  'html/css': {
    name: 'HTML/CSS',
    filename: 'index.html',
    command: 'print',
    timeout: 3000,
    template: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hello</title>
  <style>
    body {
      font-family: sans-serif;
      color: #222;
    }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is a combined HTML/CSS example.</p>
</body>
</html>`
  },
};

export type SupportedLanguage = keyof typeof LANGUAGE_SUPPORT;
