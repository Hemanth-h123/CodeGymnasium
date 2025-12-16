import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { SupportedLanguage } from '../../config/languages';

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
    const extensions: Record<SupportedLanguage, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs',
      csharp: 'cs',
    };
    return extensions[language] || 'txt';
  }

  private getExecutionCommand(language: SupportedLanguage, filepath: string): string {
    const commands: Record<SupportedLanguage, string> = {
      javascript: `node ${filepath}`,
      typescript: `ts-node ${filepath}`,
python: `python3 -u ${filepath}`,      java: `/usr/bin/javac ${filepath} && /usr/bin/java -cp $(dirname ${filepath}) $(basename ${filepath} .java)`,
      cpp: `g++ -o ${filepath}.out ${filepath} && ${filepath}.out`,
      go: `/usr/local/go/bin/go run ${filepath}`,
      rust: `/root/.cargo/bin/rustc -o ${filepath}.out ${filepath} && ${filepath}.out`,
      csharp: `/usr/bin/csc ${filepath} && ${filepath}.exe`,
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
