import express, { Request, Response } from 'express';
import { CodeExecutor } from './src/executor/codeExecutor'
import { SupportedLanguage } from ./c/config/languages'
  const app = express();
const executor = new CodeExecutor();

app.use(express.json());

interface ExecuteRequest {
  language: SupportedLanguage;
  code: string;
  timeout?: number;
}

app.post('/execute', async (req: Request<{}, {}, ExecuteRequest>, res: Response) => {
  try {
    const { language, code, timeout = 5000 } = req.body;
    
    if (!language || !code) {
      return res.status(400).json({ error: 'Missing language or code' });
    }
    
    const result = await executor.execute(language, code, timeout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Code Executor service running on port ${PORT}`);
});
