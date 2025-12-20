import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { SupportedLanguage } from '../../config/languages';
type SupportedLang = 'javascript' | 'typescript' | 'java' | 'cpp' | 'go' | 'rust' | 'csharp' | 'python' | 'sql' | 'c' | 'html' | 'css';

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}

export class CodeExecutor {
  private tempDir = '/tmp/code-executor';

  constructor() {
    try {
      mkdirSync(this.tempDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }
  }

  async execute(language: SupportedLanguage, code: string, timeout: number = 5000): Promise<ExecutionResult> {
    const startTime = Date.now();
    const filename = `${this.tempDir}/temp_${Date.now()}`;

    try {
      const extension = this.getExtension(language);
      const filepath = `${filename}.${extension}`;

      // Write code to file
      writeFileSync(filepath, code);

      // Get command based on language
      const command = this.getExecutionCommand(language, filepath);

      // Execute code with timeout
      const output = execSync(command,  { timeout, encoding: 'utf8', stdio: 'pipe' });
      const executionTime = Date.now() - startTime;

      // Cleanup
      this.cleanup(filepath);

      return {
        output: output.trim(),
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // Handle timeout specifically
      if (error.signal === 'SIGTERM') {
        // Cleanup on error
        this.cleanup(`${filename}.*`);
        return {
          output: '',
          error: 'Execution timed out',
          executionTime: timeout,
        };
      }
      
const errorMsg = error.stdout ? String(error.stdout).trim() : (error.stderr ? String(error.stderr).trim() : (error.message || String(error)));
      // Cleanup on error
      this.cleanup(`${filename}.*`);

      return {
output: error.stdout ? String(error.stdout).trim() : '', error: errorMsg.trim(),
        executionTime,
      };
    }
  }

  private getExtension(language: SupportedLanguage): string {
    const extensions: Record<SupportedLang, string> = {
      javascript: 'js',
      typescript: 'ts',
     java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
      csharp: 'cs',
      python: 'py',
      sql: 'sql',
      html: 'html',
      css: 'css',
    };
    return extensions[language] || 'txt';
  }

  private getExecutionCommand(language: SupportedLanguage, filepath: string): string {
    const path = require('path');
    const dir = path.dirname(filepath);
    const className = path.basename(filepath).replace(/\.java$/, '');
      
    // For SQL, create initialization commands
    if (language === 'sql') {
      const dbPath = path.join(dir, 'temp.db');
      const initCommands = [
        '.mode column',
        '.headers on',
        '.nullvalue NULL'
      ].join(';');
        
      return `echo "${initCommands}" | sqlite3 -header -column ${dbPath} && sqlite3 -header -column ${dbPath} ".read ${filepath}" || echo "SQL toolchain not available. Please install sqlite3."`;
    }
      
    const commands: Record<SupportedLang, string> = {
      javascript: `node ${filepath}`,
      typescript: `ts-node ${filepath}`,
      java: `javac ${filepath} && java -cp ${dir} ${className}`,
      cpp: `g++ -o ${filepath}.out ${filepath} && ${filepath}.out`,
      c: `gcc -o ${filepath}.out ${filepath} && ${filepath}.out || echo "C toolchain not available. Please install GCC."`,
      go: `/usr/local/go/bin/go run ${filepath}`,
      rust: `/root/.cargo/bin/rustc -o ${filepath}.out ${filepath} && ${filepath}.out`,
      csharp: `/usr/bin/csc ${filepath} && ${filepath}.exe`,
      python: `python ${filepath}`,
      sql: `echo "SQL execution handled separately"`,
      html: `node -e "const fs=require('fs');console.log(fs.readFileSync(process.argv[1],'utf8'))" ${filepath}`,
      css: `node -e "const fs=require('fs');console.log(fs.readFileSync(process.argv[1],'utf8'))" ${filepath}`,
    };
    return commands[language] || `node ${filepath}`;
  }

  private cleanup(filepath: string): void {
    try {
      const path = require('path');
      const fs = require('fs');
      const dir = path.dirname(filepath);
      const basename = path.basename(filepath);
      const pattern = basename.split('.')[0];

      // Delete all temp files
      const files = fs.readdirSync(dir).filter((f: string) => f.startsWith(pattern));
      files.forEach((f: string) => {
        try {
          unlinkSync(path.join(dir, f));
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
