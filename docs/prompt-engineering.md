# Prompt Engineering for Agentic AI

This document explores the prompt engineering strategies used in Codex to create effective agentic behavior, providing insights and patterns for building your own agentic AI systems.

## System Prompt Architecture

### Core System Prompt Structure

```markdown
You are an AI assistant with [CAPABILITIES].
Your goal is to [PRIMARY OBJECTIVE].
You have access to [TOOLS AND RESOURCES].

[BEHAVIORAL GUIDELINES]
[SAFETY INSTRUCTIONS]
[OUTPUT FORMATTING]
```

### Codex's System Prompt Analysis

Key elements from Codex's prompt:

```markdown
You are an AI assistant with shell access.
Your goal is to help the user with any task they need assistance with...
Keep going until the user's query is completely resolved.
```

**Key Patterns**:
1. **Clear role definition**: "AI assistant with shell access"
2. **Explicit goal**: "help the user with any task"
3. **Persistence instruction**: "Keep going until completely resolved"
4. **Tool awareness**: Detailed tool descriptions

## Prompt Layering Strategy

### 1. Base Layer: Core Behavior

```typescript
const basePrompt = `
You are an autonomous AI agent designed to complete tasks independently.
You think step-by-step and work systematically toward your goals.
You persist until the task is complete or you determine it cannot be done.
`;
```

### 2. Capability Layer: Tools and Resources

```typescript
const capabilityPrompt = `
You have access to the following tools:
- shell: Execute system commands
- read_file: Read file contents
- write_file: Create or modify files
- search: Search for patterns in code

Use tools when needed to accomplish your tasks.
`;
```

### 3. Context Layer: Project-Specific Knowledge

```typescript
const contextPrompt = `
Project Information:
- Technology stack: ${stack}
- Coding standards: ${standards}
- Project structure: ${structure}

Apply this knowledge when working on tasks.
`;
```

### 4. Safety Layer: Constraints and Guidelines

```typescript
const safetyPrompt = `
Safety Guidelines:
- Always preserve existing functionality
- Create backups before major changes
- Test changes before considering task complete
- Ask for clarification if requirements are ambiguous
`;
```

## Agentic Behavior Patterns

### 1. Goal-Oriented Instructions

**Pattern**: Make goals explicit and measurable

```markdown
❌ Poor: "Help with the code"
✅ Good: "Your task is to fix all TypeScript errors in the project. The task is complete when 'npm run typecheck' returns exit code 0."
```

### 2. Persistence and Completion

**Pattern**: Define what "done" means

```markdown
Continue working until one of these conditions is met:
1. All tests pass (exit code 0)
2. The user explicitly says to stop
3. You've exhausted all reasonable approaches

Do not give up after a single failure - try alternative approaches.
```

### 3. Tool Usage Guidance

**Pattern**: Provide tool selection heuristics

```markdown
When approaching a task:
1. First, explore the current state (ls, cat, grep)
2. Make changes incrementally (small edits)
3. Verify changes work (run tests, check output)
4. Iterate based on results

Choose the most appropriate tool for each step.
```

### 4. Error Recovery Instructions

**Pattern**: Build resilience into the prompt

```markdown
When encountering errors:
1. Read the full error message carefully
2. Identify the root cause
3. Try a different approach
4. If stuck after 3 attempts, explain the blocker

Common error patterns and solutions:
- "Permission denied" → Check file permissions with ls -la
- "Command not found" → Verify installation or use alternative
- "Module not found" → Check package.json and run npm install
```

## Dynamic Prompt Construction

### 1. Conditional Instructions

```typescript
function buildPrompt(config: Config): string {
  let prompt = basePrompt;
  
  if (config.model.includes("o1")) {
    prompt += `
    Use your reasoning capabilities to deeply analyze problems.
    Think through multiple approaches before deciding.
    `;
  }
  
  if (config.mode === "full-auto") {
    prompt += `
    You are running in fully autonomous mode.
    Make decisions independently without asking for confirmation.
    `;
  }
  
  if (config.hasTests) {
    prompt += `
    Always run tests after making changes.
    Ensure all tests pass before considering work complete.
    `;
  }
  
  return prompt;
}
```

### 2. Context-Aware Prompts

```typescript
function addProjectContext(prompt: string, project: Project): string {
  const contexts = [];
  
  // Language-specific instructions
  if (project.language === "typescript") {
    contexts.push(`
    TypeScript Guidelines:
    - Ensure type safety
    - Use proper type annotations
    - Handle null/undefined cases
    `);
  }
  
  // Framework-specific instructions
  if (project.framework === "react") {
    contexts.push(`
    React Best Practices:
    - Use functional components
    - Implement proper error boundaries
    - Follow hooks rules
    `);
  }
  
  return prompt + contexts.join('\n');
}
```

## Effective Tool Descriptions

### 1. Action-Oriented Descriptions

```typescript
// Poor: Vague description
{
  name: "file_tool",
  description: "Does file operations"
}

// Good: Clear, specific description
{
  name: "modify_file",
  description: "Safely modify a file by replacing specific content. Use this when you need to update code, fix bugs, or refactor. Preserves file formatting and encoding."
}
```

### 2. Parameter Guidance

```typescript
{
  name: "search_code",
  parameters: {
    pattern: {
      type: "string",
      description: "Regular expression pattern. Examples: 'function\\s+\\w+' for functions, 'TODO:' for todos, 'import.*from' for imports"
    },
    path: {
      type: "string", 
      description: "Directory or file to search. Use '.' for current directory, 'src/' for source only"
    }
  }
}
```

### 3. Usage Examples in Descriptions

```typescript
{
  name: "run_tests",
  description: `Run project tests and analyze results.
  
  Examples:
  - run_tests({}) - Run all tests
  - run_tests({file: "auth.test.js"}) - Run specific test file
  - run_tests({grep: "login"}) - Run tests matching pattern
  
  Returns test results with failure details for debugging.`
}
```

## Chain-of-Thought Prompting

### 1. Explicit Reasoning Steps

```markdown
When solving problems, follow this process:

1. **Understand**: What is the actual problem?
2. **Analyze**: What are the constraints and requirements?
3. **Plan**: What steps will solve this?
4. **Execute**: Implement the plan step by step
5. **Verify**: Did this solve the problem?
6. **Iterate**: If not solved, what's next?

Show your reasoning for complex decisions.
```

### 2. Decision Frameworks

```markdown
When choosing between approaches:

Consider:
- Complexity: Simpler is usually better
- Safety: Will this break existing functionality?
- Performance: Will this scale?
- Maintainability: Will others understand this?

Explain your choice when multiple valid options exist.
```

## Meta-Instructions

### 1. Self-Monitoring

```markdown
Monitor your own progress:
- If you're repeating the same action, try a different approach
- If you've made no progress in 3 attempts, analyze why
- If the task seems impossible, explain what's blocking you
```

### 2. Learning from Feedback

```markdown
When your action produces unexpected results:
1. Don't just retry the same thing
2. Analyze why it didn't work
3. Adjust your approach based on the error
4. Document what you learned for future reference
```

## Prompt Patterns for Common Tasks

### 1. Debugging Pattern

```markdown
When debugging:
1. Reproduce the issue first
2. Gather diagnostic information (logs, errors, state)
3. Form hypotheses about the cause
4. Test each hypothesis systematically
5. Implement the fix
6. Verify the issue is resolved
7. Check for side effects
```

### 2. Refactoring Pattern

```markdown
When refactoring code:
1. Understand current functionality completely
2. Identify improvement opportunities
3. Make changes incrementally
4. Run tests after each change
5. Ensure behavior remains identical
6. Update documentation if needed
```

### 3. Implementation Pattern

```markdown
When implementing new features:
1. Clarify requirements first
2. Design the approach
3. Implement in small, testable chunks
4. Write tests alongside implementation
5. Handle edge cases
6. Document the feature
```

## Anti-Patterns to Avoid

### 1. Over-Constraining

```markdown
❌ Bad: "Only use these exact commands in this exact order..."
✅ Good: "Use appropriate tools to accomplish the task"
```

### 2. Contradictory Instructions

```markdown
❌ Bad: "Be creative but follow the exact pattern"
✅ Good: "Follow the project's patterns while solving the problem effectively"
```

### 3. Vague Success Criteria

```markdown
❌ Bad: "Make the code better"
✅ Good: "Improve code quality by: reducing complexity below 10, achieving 90% test coverage, and removing all ESLint warnings"
```

## Testing and Iteration

### 1. Prompt Testing Framework

```typescript
class PromptTester {
  async testPrompt(prompt: string, scenarios: Scenario[]): Promise<Results> {
    const results = [];
    
    for (const scenario of scenarios) {
      const response = await this.llm.complete(prompt + scenario.input);
      
      results.push({
        scenario: scenario.name,
        success: this.evaluate(response, scenario.expected),
        response
      });
    }
    
    return this.summarize(results);
  }
}
```

### 2. Iterative Refinement

```typescript
// Start with base prompt
let prompt = "Fix the bug in the authentication system";

// Add specificity
prompt += "\nThe bug causes login to fail for users with special characters in passwords";

// Add success criteria
prompt += "\nSuccess: All authentication tests pass";

// Add context
prompt += "\nThe auth system uses bcrypt for hashing and JWT for sessions";
```

## Advanced Techniques

### 1. Role-Playing

```markdown
You are a senior software engineer with expertise in distributed systems.
Approach this task as you would in a professional setting:
- Consider scalability from the start
- Write production-quality code
- Include proper error handling
- Think about edge cases
```

### 2. Analogical Reasoning

```markdown
Think of this refactoring task like renovating a house:
- Don't tear down walls that are load-bearing (core functionality)
- Work room by room (module by module)
- Keep the house livable during renovation (maintain working state)
- Test each change before moving on
```

### 3. Constraint Satisfaction

```markdown
Constraints for this task:
- Must complete within 5 minutes of execution time
- Cannot modify files outside the src/ directory
- Must maintain backward compatibility
- Should improve performance by at least 20%

Find a solution that satisfies all constraints.
```

## Key Takeaways

1. **Clarity Drives Behavior**: Clear, specific prompts produce better agentic behavior
2. **Layer Prompts**: Build from general to specific, core behavior to project details
3. **Define Success**: Always specify what "done" looks like
4. **Enable Recovery**: Include error handling and retry strategies
5. **Context Matters**: Provide relevant project and domain knowledge
6. **Test and Iterate**: Continuously refine prompts based on real usage
7. **Balance Freedom and Guidance**: Give enough direction without over-constraining

Effective prompt engineering is the foundation of successful agentic AI systems. The prompts shape not just what the agent does, but how it thinks about and approaches problems.