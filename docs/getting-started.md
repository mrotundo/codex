# Getting Started with Codex

This guide will help you understand and start using Codex as both a tool and a framework for building agentic AI systems.

## Installation

### Using npm (Recommended)
```bash
npm install -g @anthropic/codex
```

### Using Homebrew (macOS)
```bash
brew tap anthropic/tap
brew install codex
```

### From Source
```bash
git clone https://github.com/anthropics/codex.git
cd codex
npm install
npm run build
npm link
```

## Basic Usage

### Simple Command
```bash
codex "create a hello world Python script"
```

### Interactive Mode
```bash
codex
```

### With Specific Model
```bash
codex -m o1-preview "analyze this codebase for security issues"
```

## Configuration

### API Keys

Set your API key as an environment variable:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

Or use other providers:
```bash
export ANTHROPIC_API_KEY="your-api-key"
export GOOGLE_AI_API_KEY="your-api-key"
```

### Configuration File

Create `~/.codex/config.json`:
```json
{
  "model": "gpt-4",
  "autoApprove": "suggest",
  "reasoningEffort": "high",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/home/user"]
    }
  }
}
```

## Core Concepts

### 1. Approval Modes

Codex operates in three approval modes:

- **suggest** (default): Manual approval for modifications
- **auto-edit**: Auto-approve file edits
- **full-auto**: Auto-approve everything (sandboxed)

```bash
# Default mode
codex "fix the bug in auth.js"

# Auto-edit mode
codex -a auto-edit "refactor all test files"

# Full-auto mode (use with caution)
codex -a full-auto "set up a new React project"
```

### 2. Context Management

Provide context through AGENTS.md files:

```markdown
# AGENTS.md
## Project Overview
This is a Node.js Express API with PostgreSQL

## Coding Standards
- Use async/await
- Add JSDoc comments
- Write tests for all endpoints

## Project Structure
- `/src` - Source code
- `/tests` - Test files
- `/docs` - Documentation
```

### 3. Tool Usage

Codex uses tools to interact with your system:

- **shell**: Execute commands
- **apply_patch**: Modify files
- **MCP tools**: External integrations

## Common Tasks

### Code Generation
```bash
codex "create a REST API endpoint for user authentication"
```

### Debugging
```bash
codex "find and fix the error causing the app to crash on startup"
```

### Refactoring
```bash
codex "refactor the database module to use connection pooling"
```

### Testing
```bash
codex "write unit tests for the payment processing module"
```

### Documentation
```bash
codex "generate API documentation from the code comments"
```

## Advanced Features

### 1. Using MCP Servers

Configure external tools:
```json
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-server-postgres",
      "args": ["--connection", "postgresql://localhost/mydb"]
    }
  }
}
```

### 2. Custom Instructions

Create `~/.codex/instructions.md`:
```markdown
Always use TypeScript
Prefer functional programming
Include error handling
```

### 3. Reasoning Models

For complex tasks, use reasoning models:
```bash
codex -m o1-preview --reasoning-effort high "design a scalable microservices architecture"
```

## Best Practices

### 1. Be Specific
```bash
# Good
codex "add input validation to the login endpoint using Joi"

# Less effective
codex "improve the login"
```

### 2. Provide Context
```bash
# Change to project directory first
cd my-project
codex "update dependencies and fix any breaking changes"
```

### 3. Use Approval Modes Wisely
- Use `suggest` for unfamiliar codebases
- Use `auto-edit` for trusted projects
- Use `full-auto` only with good backups

### 4. Review Changes
```bash
# Always review what Codex did
git diff
git status
```

## Troubleshooting

### API Key Issues
```bash
# Check if key is set
echo $OPENAI_API_KEY

# Test API access
codex "say hello"
```

### Permission Issues
```bash
# Codex respects file permissions
ls -la
chmod +w file.txt
```

### Context Too Large
If you get context errors:
1. Shorten AGENTS.md files
2. Start a new conversation
3. Use a model with larger context

## Security Notes

- Codex runs commands in a sandbox by default
- Review all commands before approval
- Use version control for safety
- Don't store sensitive data in AGENTS.md

## Next Steps

1. Explore the [Architecture Overview](./architecture-overview.md)
2. Learn about [Agentic AI Framework](./agentic-ai-framework.md)
3. Read [Best Practices](./best-practices-agentic-ai.md)
4. Check the [Security Model](./security-model.md)

## Getting Help

- GitHub Issues: https://github.com/anthropics/codex/issues
- Documentation: https://docs.anthropic.com/codex
- Community: Discord/Slack channels

Start with simple tasks and gradually explore more complex capabilities as you become comfortable with Codex's agentic approach to development assistance.