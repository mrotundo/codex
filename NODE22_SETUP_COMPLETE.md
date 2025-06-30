# Node.js 22 Setup Complete

## What Was Done

1. **Set Node.js 22 as the default version** in nvm:
   ```bash
   nvm alias default 22
   ```

2. **Updated shell configurations** for both bash and zsh:
   - Modified `~/.bashrc` to load nvm first and ensure nvm's Node takes precedence
   - Modified `~/.zshrc` with the same configuration
   - Added explicit PATH configuration to prioritize nvm's Node over system Node

3. **Path Priority Fixed**: 
   - nvm's Node.js 22 at `/Users/developer/.nvm/versions/node/v22.17.0/bin/node` now takes precedence
   - System Node.js 18 at `/usr/local/bin/node` is now lower priority in PATH

## Verification

Both shells now use Node.js 22 by default:
- Bash: `v22.17.0`
- Zsh: `v22.17.0`

## Starting the Server

You can now start the server normally in any new terminal:

```bash
cd codex-server
npm run dev
```

Or use the UI development mode:
```bash
cd codex-server
npm run dev:all
```

The server will automatically use Node.js 22, which is required for the Codex CLI to function properly.

## Note
If you're in an existing terminal session, you'll need to either:
1. Open a new terminal window/tab, or
2. Run `source ~/.bashrc` (for bash) or `source ~/.zshrc` (for zsh) to reload the configuration