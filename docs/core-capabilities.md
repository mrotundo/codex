# Core Capabilities

Codex provides a comprehensive set of capabilities for building and deploying agentic AI systems. This document outlines the key features and their implementation details.

## Capability Matrix

| Capability | Description | Implementation |
|------------|-------------|----------------|
| **Autonomous Execution** | Continuous operation until task completion | Agent loop with iterative processing |
| **Multi-Model Support** | Compatible with 15+ LLM providers | Unified API interface |
| **Tool Ecosystem** | Extensible tool system with MCP | Built-in tools + external integrations |
| **Safety Controls** | Multi-layered approval and sandboxing | Platform-specific isolation |
| **Streaming Responses** | Real-time output streaming | SSE and async iterators |
| **Context Management** | Hierarchical context system | AGENTS.md + dynamic prompts |
| **Error Recovery** | Robust retry mechanisms | Exponential backoff with categorization |
| **File Operations** | Safe code modifications | Apply-patch language |
| **Search Capabilities** | Fast file and content search | Rust-based fuzzy matching |
| **Session Management** | Conversation persistence | Local history + server storage |

## 1. Autonomous Agent Capabilities

### Continuous Operation
The agent operates in a loop until the user's task is fully resolved:

```typescript
while (turnInput.length > 0) {
  // Process input
  // Execute tools
  // Generate responses
  // Continue until done
}
```

### Intelligent Tool Selection
- Parses function calls from LLM responses
- Validates tool availability
- Handles tool execution and result integration

### Multi-Step Task Execution
- Chains tool calls automatically
- Maintains context between operations
- Tracks progress through execution

## 2. Language Model Integration

### Supported Providers

**Primary Models**:
- OpenAI (GPT-4, o1, o3, o4)
- Anthropic (Claude 3)
- Google (Gemini)
- DeepSeek
- xAI (Grok)

**Local/Open Source**:
- Ollama
- Mistral
- Groq
- Custom endpoints

### Advanced Features

**Reasoning Models**:
- Special support for o1/o3/o4 models
- Configurable reasoning effort levels
- Automatic reasoning summaries

**Streaming Capabilities**:
- Real-time token streaming
- Cancellable operations
- Progress indicators

## 3. Tool System

### Built-in Tools

**Shell Tool**:
```json
{
  "name": "shell",
  "description": "Execute shell commands",
  "parameters": {
    "command": "string",
    "wait_for_seconds": "number?"
  }
}
```

**Apply Patch Tool**:
```json
{
  "name": "apply_patch",
  "description": "Apply code modifications",
  "parameters": {
    "patch": "string"
  }
}
```

### MCP (Model Context Protocol) Integration

Supports external tool servers:
- File system operations
- Database queries
- API integrations
- Custom business logic

Configuration:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/allowed/path"]
    }
  }
}
```

## 4. Safety and Security

### Approval System

Three modes of operation:

1. **Suggest Mode** (Default):
   - Manual approval for all operations
   - Read-only operations auto-approved
   - Full user control

2. **Auto-edit Mode**:
   - File modifications auto-approved
   - Commands still require approval
   - Balanced automation

3. **Full-auto Mode**:
   - All operations auto-approved
   - Sandboxed execution
   - Maximum automation

### Sandboxing

**macOS** (Seatbelt):
```scheme
(version 1)
(deny default)
(allow process-exec)
(allow file-read*)
(allow file-write* (subpath "/allowed/path"))
```

**Linux** (Landlock):
- File system restrictions
- Network isolation
- Process limitations

## 5. Code Modification

### Apply-Patch Language

Safe, explicit code modifications:

```
<<<<<<< ORIGINAL
function oldCode() {
  return 42;
}
=======
function newCode() {
  return 43;
}
>>>>>>> MODIFIED
```

Features:
- Fuzzy matching for context
- Unicode normalization
- Whitespace tolerance
- Multi-file support

## 6. Search and Navigation

### File Search
- Fuzzy matching with scoring
- Respects `.gitignore`
- Real-time results
- Pattern highlighting

### Content Search
- Regex support
- File type filtering
- Context display
- Integration with ripgrep

## 7. Context Management

### Hierarchical Context System

1. **System Instructions**: Base Codex behavior
2. **User Instructions**: Personal customizations
3. **Project Documentation**: AGENTS.md files

### Dynamic Context Building
- Working directory awareness
- User information
- Model-specific instructions
- Tool availability

## 8. Error Handling

### Retry Strategies

**Network Errors**:
- Up to 8 attempts
- Exponential backoff
- Connection pooling

**Rate Limits**:
- Intelligent retry timing
- Suggested wait periods
- Fallback strategies

**Stream Failures**:
- Up to 5 attempts
- Partial result recovery
- Graceful degradation

## 9. User Interface

### Terminal UI Features
- Syntax highlighting
- Progress indicators
- Interactive approvals
- File tag suggestions
- Markdown rendering

### Command Line Interface
```bash
codex [options] [message]

Options:
  -m, --model <model>     LLM model to use
  -p, --prompt <prompt>   Additional system prompt
  -a, --auto-approve      Approval mode
  --no-cache             Disable caching
```

## 10. Performance Features

### Optimizations
- Rust-based file operations
- Streaming architecture
- Lazy loading
- Efficient memory usage

### Benchmarks
- File search: <100ms for 100k files
- Patch application: <50ms
- First token latency: <1s

## 11. Extensibility

### Plugin Points
- Custom LLM providers
- Additional tools
- UI themes
- Sandbox policies

### API Integration
```typescript
// Custom tool example
const customTool = {
  name: "my_tool",
  description: "Custom functionality",
  parameters: { /* schema */ },
  execute: async (params) => { /* implementation */ }
};
```

## 12. Monitoring and Debugging

### Logging
- Structured logs
- Debug mode
- Performance metrics
- Error tracking

### Debugging Features
- Request/response capture
- Tool execution traces
- Context inspection
- Rollout tracking

This comprehensive capability set makes Codex suitable for a wide range of AI-assisted development tasks while maintaining safety and user control.