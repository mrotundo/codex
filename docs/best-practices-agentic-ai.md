# Best Practices for Building Agentic AI Systems

Based on the analysis of Codex's architecture and implementation, this document distills key lessons and best practices for building production-ready agentic AI systems.

## Core Principles

### 1. Simplicity Enables Complexity

**Principle**: Complex agentic behavior emerges from simple, well-designed primitives.

**Implementation in Codex**:
```typescript
// Simple loop + tools = complex behavior
while (hasWork) {
  const action = await decidenextAction();
  const result = await executeAction(action);
  updateState(result);
}
```

**Best Practice**:
- Start with minimal components (loop, tools, state)
- Let sophisticated behavior emerge from interactions
- Avoid over-engineering early

### 2. Tools Extend Agency

**Principle**: An agent's capabilities are defined by its tools.

**Implementation**:
```typescript
interface Tool {
  name: string;
  description: string;  // Critical for LLM understanding
  execute: (params: any) => Promise<any>;
}
```

**Best Practice**:
- Design tools with clear, single responsibilities
- Write descriptive tool documentation for LLM comprehension
- Make tools composable for complex operations
- Consider tool discovery and dynamic loading

### 3. Context is King

**Principle**: Rich context enables better decision-making.

**Hierarchical Context System**:
```
System Instructions → User Preferences → Project Context → Session State
```

**Best Practice**:
- Layer contexts from general to specific
- Limit context size to prevent overflow
- Make context inspectable and debuggable
- Allow user customization at appropriate levels

## Architecture Patterns

### 1. The Agent Loop Pattern

**Pattern**: Central orchestration loop for autonomous operation.

```typescript
class AgentLoop {
  async run() {
    while (this.hasWork()) {
      // Perceive
      const input = await this.getInput();
      
      // Decide
      const decision = await this.llm.decide(input, this.context);
      
      // Act
      const result = await this.execute(decision);
      
      // Reflect
      this.updateState(result);
    }
  }
}
```

**Benefits**:
- Clear control flow
- Easy to debug
- Natural integration points
- Supports cancellation

### 2. Streaming-First Architecture

**Pattern**: Use streaming for all LLM interactions.

```typescript
async *streamResponse(prompt: string): AsyncGenerator<ResponseChunk> {
  const stream = await this.llm.complete(prompt);
  
  for await (const chunk of stream) {
    yield this.processChunk(chunk);
    
    if (chunk.toolCall) {
      const result = await this.executeTool(chunk.toolCall);
      yield { type: 'tool_result', result };
    }
  }
}
```

**Benefits**:
- Lower latency perception
- Cancellable operations
- Progressive rendering
- Better user experience

### 3. Safety-First Design

**Pattern**: Multiple layers of safety controls.

```typescript
class SafeExecutor {
  async execute(action: Action) {
    // Layer 1: Approval
    if (!await this.approve(action)) return;
    
    // Layer 2: Validation
    if (!this.validate(action)) return;
    
    // Layer 3: Sandboxing
    return await this.sandbox.execute(action);
  }
}
```

**Benefits**:
- Defense in depth
- Graceful degradation
- User trust
- Audit trail

## Memory Management

### 1. Hierarchical Memory

**Pattern**: Layer memory systems by scope and lifetime.

```typescript
interface MemoryHierarchy {
  working: WorkingMemory;      // Current task
  session: SessionMemory;      // Current conversation
  project: ProjectMemory;      // Project knowledge
  system: SystemMemory;        // Core capabilities
}
```

**Best Practice**:
- Keep working memory small and focused
- Persist important session information
- Load project context lazily
- Make system memory immutable

### 2. Context Window Management

**Pattern**: Intelligent context pruning and summarization.

```typescript
class ContextManager {
  build(messages: Message[], limit: number): Message[] {
    // Priority order
    const priority = [
      this.systemPrompt,        // Always include
      this.recentMessages,      // Most relevant
      this.projectContext,      // If space
      this.historicalSummary    // Compressed history
    ];
    
    return this.fitWithinLimit(priority, limit);
  }
}
```

**Best Practice**:
- Estimate tokens conservatively
- Prioritize recent and relevant information
- Consider summarization for old content
- Monitor context usage

### 3. Stateless by Default

**Pattern**: Each session starts fresh unless explicitly continued.

**Benefits**:
- Predictable behavior
- Easy testing
- No hidden state
- Clear mental model

**Implementation**:
```typescript
class Session {
  static new(): Session {
    return new Session({
      id: uuid(),
      messages: [],
      state: 'fresh'
    });
  }
  
  static continue(id: string): Session {
    const saved = storage.load(id);
    return new Session(saved);
  }
}
```

## Error Handling

### 1. Retry with Intelligence

**Pattern**: Exponential backoff with error categorization.

```typescript
async retryWithIntelligence<T>(
  operation: () => Promise<T>,
  context: RetryContext
): Promise<T> {
  for (let attempt = 0; attempt < context.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const strategy = this.categorize(error);
      
      if (strategy === 'no_retry') throw error;
      
      if (strategy === 'immediate_retry') continue;
      
      if (strategy === 'backoff') {
        await this.delay(Math.pow(2, attempt) * 1000);
      }
      
      if (strategy === 'alternate_approach') {
        operation = this.alternate(operation);
      }
    }
  }
}
```

### 2. Graceful Degradation

**Pattern**: Provide partial results when possible.

```typescript
async executeWithFallback(task: Task): Promise<Result> {
  try {
    return await this.primary.execute(task);
  } catch (error) {
    if (this.canDegrade(error)) {
      return await this.fallback.execute(task);
    }
    
    if (this.hasPartialResult(error)) {
      return this.partialResult(error);
    }
    
    throw error;
  }
}
```

### 3. Error as Information

**Pattern**: Failed attempts guide future actions.

```typescript
class LearningExecutor {
  private failures = new Map<string, Error[]>();
  
  async execute(task: Task): Promise<Result> {
    const context = this.buildContext(task);
    
    // Include previous failures in context
    const previousFailures = this.failures.get(task.type) || [];
    context.failures = previousFailures;
    
    try {
      return await this.doExecute(task, context);
    } catch (error) {
      this.failures.set(task.type, [...previousFailures, error]);
      throw error;
    }
  }
}
```

## Tool Design

### 1. Single Responsibility Tools

**Pattern**: Each tool does one thing well.

```typescript
// Good: Focused tools
const tools = [
  { name: "read_file", execute: async (path) => fs.readFile(path) },
  { name: "write_file", execute: async (path, content) => fs.writeFile(path, content) },
  { name: "list_files", execute: async (pattern) => glob(pattern) }
];

// Bad: Kitchen sink tool
const tool = {
  name: "file_operations",
  execute: async (op, ...args) => {
    switch(op) {
      case 'read': //...
      case 'write': //...
      case 'delete': //...
      // Too many responsibilities
    }
  }
};
```

### 2. Tool Composition

**Pattern**: Complex operations through tool combination.

```typescript
// Agent composes tools to achieve goals
// Task: "Refactor all TypeScript files"
// Agent plan:
// 1. list_files("**/*.ts")
// 2. For each file:
//    a. read_file(file)
//    b. refactor_code(content)
//    c. write_file(file, refactored)
// 3. run_tests()
```

### 3. Tool Documentation

**Pattern**: Rich descriptions for LLM understanding.

```typescript
const wellDocumentedTool = {
  name: "search_code",
  description: "Search for code patterns across the codebase using regex",
  parameters: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Regular expression pattern to search for"
      },
      file_pattern: {
        type: "string",
        description: "Glob pattern for files to search (e.g., '**/*.js')"
      },
      max_results: {
        type: "number",
        description: "Maximum number of results to return",
        default: 100
      }
    },
    required: ["pattern"]
  }
};
```

## Production Considerations

### 1. Observability

**Pattern**: Comprehensive logging and monitoring.

```typescript
class ObservableAgent {
  async execute(task: Task): Promise<Result> {
    const span = tracer.startSpan('agent.execute');
    span.setAttributes({
      'task.type': task.type,
      'task.id': task.id,
      'model': this.model
    });
    
    try {
      const result = await this.doExecute(task);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }
}
```

### 2. Cost Management

**Pattern**: Token usage tracking and limits.

```typescript
class CostAwareAgent {
  private tokenBudget = 1000000;  // Monthly budget
  private tokensUsed = 0;
  
  async execute(prompt: string): Promise<Response> {
    const estimatedTokens = this.estimateTokens(prompt);
    
    if (this.tokensUsed + estimatedTokens > this.tokenBudget) {
      throw new Error('Token budget exceeded');
    }
    
    const response = await this.llm.complete(prompt);
    this.tokensUsed += response.usage.total_tokens;
    
    return response;
  }
}
```

### 3. Rate Limiting

**Pattern**: Respect API limits gracefully.

```typescript
class RateLimitedClient {
  private limiter = new RateLimiter({
    tokensPerMinute: 90000,
    requestsPerMinute: 3500
  });
  
  async request(params: RequestParams): Promise<Response> {
    await this.limiter.acquire(params.estimatedTokens);
    
    try {
      return await this.client.request(params);
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.headers['retry-after'];
        await this.delay(retryAfter * 1000);
        return this.request(params);  // Retry
      }
      throw error;
    }
  }
}
```

## Testing Strategies

### 1. Deterministic Testing

**Pattern**: Control non-determinism for testing.

```typescript
class TestableAgent {
  constructor(private llm: LLMClient, private random?: () => number) {
    this.random = random || Math.random;
  }
  
  async decide(options: string[]): Promise<string> {
    if (process.env.NODE_ENV === 'test') {
      // Deterministic in tests
      return options[0];
    }
    
    // Use LLM in production
    return this.llm.choose(options);
  }
}
```

### 2. Mock Tools

**Pattern**: Test agent logic without side effects.

```typescript
class MockToolExecutor {
  private mocks = new Map<string, Function>();
  
  mock(tool: string, implementation: Function) {
    this.mocks.set(tool, implementation);
  }
  
  async execute(tool: string, params: any): Promise<any> {
    const mock = this.mocks.get(tool);
    if (mock) return mock(params);
    
    throw new Error(`No mock for tool: ${tool}`);
  }
}
```

### 3. Scenario Testing

**Pattern**: Test complete interaction flows.

```typescript
describe('Agent Scenarios', () => {
  it('should fix failing tests', async () => {
    const scenario = new Scenario()
      .userSays("Fix the failing tests")
      .agentRuns("npm test")
      .toolReturns({ exitCode: 1, output: "Test failed: auth.test.js" })
      .agentRuns("cat auth.test.js")
      .toolReturns({ content: "..." })
      .agentPatches("auth.js", fixing)
      .agentRuns("npm test")
      .toolReturns({ exitCode: 0, output: "All tests passed" })
      .agentResponds("I've fixed the failing test in auth.test.js");
    
    await scenario.execute();
  });
});
```

## Common Pitfalls and Solutions

### 1. Context Overflow

**Problem**: Too much context crashes or degrades performance.

**Solution**: Implement context windowing and prioritization.

### 2. Infinite Loops

**Problem**: Agent gets stuck repeating actions.

**Solution**: 
- Loop detection
- Maximum iteration limits
- State change requirements

### 3. Over-Automation

**Problem**: Agent does too much without user awareness.

**Solution**:
- Progressive disclosure
- Clear action summaries
- Approval checkpoints

### 4. Prompt Injection

**Problem**: Malicious inputs manipulate agent behavior.

**Solution**:
- Clear system/user boundaries
- Input validation
- Behavioral monitoring

## Key Takeaways

1. **Start Simple**: Basic loops and tools create sophisticated behavior
2. **Safety First**: Build security in from the beginning
3. **User Control**: Maintain transparency and user agency
4. **Embrace Streaming**: Better UX through progressive updates
5. **Layer Contexts**: Hierarchical organization improves comprehension
6. **Handle Errors Gracefully**: Failures are learning opportunities
7. **Design for Observability**: You can't improve what you can't measure
8. **Test Holistically**: Scenario-based testing catches real issues
9. **Document for LLMs**: Tools need rich descriptions
10. **Iterate Based on Usage**: Real-world usage reveals true requirements

Building agentic AI systems requires balancing autonomy with control, power with safety, and complexity with comprehensibility. Codex demonstrates that these balances are achievable through thoughtful architecture and careful implementation.