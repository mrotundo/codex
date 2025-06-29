# No Simulation Mode

This Codex API wrapper **ONLY** uses the real Codex CLI. There is no simulation or fallback mode.

## Requirements

For the system to work, you MUST have:

1. **Node.js 22 or higher**
   ```bash
   node --version  # Must show v22.x.x or higher
   ```

2. **Codex CLI installed**
   - The CLI must exist at `codex-cli/bin/codex.js`
   - The dist files must be built

3. **OpenAI API Key**
   - Set in `.env` file as `OPENAI_API_KEY`
   - Or configured in `~/.codex/auth.json` via CLI login
   - Or set in environment variable

## Error Handling

If any requirement is not met, jobs will fail with clear error messages:

- **Node.js < 22**: `"Codex CLI requires Node.js 22 or higher. Current version: vX.X.X"`
- **CLI not found**: `"Codex CLI not found at /path/to/codex-cli/bin/codex.js"`
- **No API key**: Jobs will fail with OpenAI authentication errors

## No Fallbacks

The system will **NEVER**:
- Use simulated responses
- Fall back to mock data
- Pretend to execute commands

It will **ALWAYS**:
- Use the real Codex CLI
- Make real OpenAI API calls
- Execute real commands (with approval)

## Troubleshooting

If jobs are failing:

1. **Check Node.js version**:
   ```bash
   node --version
   ```

2. **Verify Codex CLI exists**:
   ```bash
   ls -la codex-cli/bin/codex.js
   ls -la codex-cli/dist/cli.js
   ```

3. **Test API key**:
   ```bash
   echo $OPENAI_API_KEY
   ```

4. **Check server logs** for specific error messages

## Benefits

- **Authenticity**: Always uses real AI responses
- **Transparency**: No hidden simulation mode
- **Reliability**: Clear errors when requirements aren't met
- **Trust**: You know exactly what's running