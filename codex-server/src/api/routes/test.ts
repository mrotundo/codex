import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

// Test endpoint to check Codex binary availability
router.get('/test/codex-binary', async (req, res) => {
  const fs = require('fs');
  
  const paths = {
    'release': path.join(__dirname, '../../../../target/release/codex'),
    'debug': path.join(__dirname, '../../../../target/debug/codex'),
    'codex-rs/release': path.join(__dirname, '../../../../codex-rs/target/release/codex'),
    'codex-rs/debug': path.join(__dirname, '../../../../codex-rs/target/debug/codex'),
    'ts-cli': path.join(__dirname, '../../../../codex-cli/dist/cli.js'),
  };
  
  const results: any = {};
  
  for (const [name, binPath] of Object.entries(paths)) {
    results[name] = {
      path: binPath,
      exists: fs.existsSync(binPath),
    };
    
    if (results[name].exists && name !== 'ts-cli') {
      try {
        // Try to get version
        const proc = spawn(binPath, ['--version']);
        const output = await new Promise<string>((resolve) => {
          let data = '';
          proc.stdout?.on('data', chunk => data += chunk);
          proc.stderr?.on('data', chunk => data += chunk);
          proc.on('close', () => resolve(data));
        });
        results[name].version = output.trim();
      } catch (err: any) {
        results[name].error = err.message;
      }
    }
  }
  
  res.json({
    codexAvailable: Object.values(results).some((r: any) => r.exists),
    binaries: results,
    recommendation: Object.entries(results).find(([_, r]: any) => r.exists)?.[0] || 'none'
  });
});

export default router;