# Client Implementation Guide for Computer-Use-CC Tool

## Overview

The client receives task parameters from the server and constructs a Claude CLI command to execute the task autonomously.

## Command Construction

### Basic Command Structure

```bash
claude --add-dir <working-directory> [--yes] --max-turns {maxIterations} -p "{prompt}"
```

### Parameters from Server

```typescript
interface ComputerUseCCRequest {
  type: 'computer-use-cc-request';
  taskId: string;
  prompt: string; // Natural-language prompt for Claude Code CLI
  maxIterations?: number; // Default: 5
  autoApprove?: boolean; // Default: true
}
```

### Client Implementation Example

```typescript
// Electron Handler
export class ComputerUseCCHandler {
  @IpcHandler('executeComputerUseCC')
  async execute(event, data: ComputerUseCCRequest) {
    const { prompt, maxIterations, autoApprove, taskId } = data;

    // Build Claude CLI command
    const args = [
      'chat',
      '--print', // Non-interactive mode
      '--max-turns',
      maxIterations.toString(),
      '-p',
      prompt, // The natural-language prompt
    ];

    if (autoApprove) {
      args.push('--yes'); // Auto-approve changes
    }

    // Add context from current workspace
    const contextFiles = await this.getRelevantFiles();
    contextFiles.forEach(file => {
      args.push('--file', file);
    });

    // Execute in current project directory
    const proc = spawn('claude', args, {
      cwd: this.getCurrentWorkspace(),
      env: { ...process.env },
    });

    // Stream output back
    proc.stdout.on('data', chunk => {
      this.streamToServer(taskId, chunk.toString());
    });

    // Handle completion
    proc.on('close', code => {
      if (code === 0) {
        this.sendCallback(taskId, 'completed', output);
      } else {
        this.sendCallback(taskId, 'failed', `Exit code: ${code}`);
      }
    });
  }
}
```

## Prompt Examples and Expected Commands

### Example 1 – List GitHub repositories

```typescript
// Server sends:
{
  prompt: "List all GitHub repositories under ~/Documents (max depth 2)",
  maxIterations: 3,
  autoApprove: true
}

// Client executes:
claude --add-dir ~/Documents --yes --max-turns 3 -p "List all GitHub repositories under ~/Documents (max depth 2)"
```

### Example 2 – Find duplicate images

```typescript
// Server sends:
{
  prompt: "Find duplicate *.jpg or *.png files in ~/Pictures and show their paths",
  maxIterations: 4,
  autoApprove: false
}

// Client executes:
claude --add-dir ~/Pictures --max-turns 4 -p "Find duplicate *.jpg or *.png files in ~/Pictures and show their paths"
```

### Example 3 – Organise downloads folder

```typescript
// Server sends:
{
  prompt: "Move every .zip file older than 30 days from ~/Downloads to ~/Archives/old-zips",
  maxIterations: 5,
  autoApprove: true
}

// Client executes:
claude --add-dir ~/Downloads --yes --max-turns 5 -p "Move every .zip file older than 30 days from ~/Downloads to ~/Archives/old-zips"
```

## Client Responsibilities

### 1. Context Detection

The client should automatically:

- Detect current working directory
- Find relevant files based on task content
- Include open files in editor (if available)
- Add project configuration files (package.json, tsconfig.json, etc.)

### 2. Environment Setup

```typescript
const env = {
  ...process.env,
  // Ensure Claude has access to tools
  PATH: process.env.PATH,
  // Add project-specific env vars if needed
  NODE_ENV: 'development',
};
```

### 3. Sending Results

Wait until the Claude CLI process exits, collect its full stdout, and send a single callback:

```typescript
proc.on('close', code => {
  const status = code === 0 ? 'completed' : 'failed';
  sendCallback(taskId, status, output);
});
```

### 4. Error Handling

Handle various failure scenarios:

```typescript
// Claude CLI not found
if (!isClaudeInstalled()) {
  return sendError(taskId, 'Claude CLI is not installed. Please install it first.');
}

// Process errors
proc.on('error', err => {
  if (err.code === 'ENOENT') {
    sendError(taskId, 'Claude CLI not found in PATH');
  } else {
    sendError(taskId, `Process error: ${err.message}`);
  }
});

// Timeout handling
const timeout = setTimeout(
  () => {
    proc.kill();
    sendError(taskId, 'Task exceeded maximum execution time');
  },
  10 * 60 * 1000
); // 10 minutes max
```

## Best Practices

### 1. Task Precision

The server should generate precise, actionable tasks:

- ✅ "Fix the TypeScript error in auth.service.ts line 45 about missing return type"
- ✅ "Add input validation to all POST endpoints in the user controller"
- ❌ "Make the code better"
- ❌ "Fix bugs"

### 2. Iteration Control

- Start with fewer iterations (3-5) for simple tasks
- Use more iterations (7-10) for complex refactoring
- Monitor progress through streaming output

### 3. Auto-Approval

- `autoApprove: true` for safe operations (adding tests, documentation)
- `autoApprove: false` for risky operations (database migrations, API changes)

## Security Considerations

### 1. Command Injection Prevention

```typescript
// Sanitize task input
const sanitizedTask = task.replace(/[`$]/g, '\\$&');
```

### 2. Working Directory Restrictions

```typescript
// Ensure Claude only works in allowed directories
const allowedPaths = ['/home/user/projects', '/Users/*/Documents'];
if (!isPathAllowed(cwd, allowedPaths)) {
  throw new Error('Working directory not allowed');
}
```

### 3. Resource Limits

```typescript
// Set resource limits for the Claude process
const proc = spawn('claude', args, {
  cwd,
  env,
  // Limit memory and CPU
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false,
});
```

## Testing the Implementation

### Manual Test Command

```bash
# Test the exact command that will be generated
claude --add-dir . --yes --max-turns 5 -p "Add error handling to all async functions in src/"

# With specific files
claude --add-dir . --yes --max-turns 3 -p "Add JSDoc comments to all exported functions" --file src/index.ts --file src/utils.ts
```

### Integration Test

```typescript
describe('ComputerUseCCHandler', () => {
  it('should construct correct Claude command', () => {
    const handler = new ComputerUseCCHandler();
    const command = handler.buildCommand({
      prompt: 'Fix TypeScript errors',
      maxIterations: 5,
      autoApprove: true,
    });

    expect(command).toEqual(['claude', '--add-dir', '.', '--yes', '--max-turns', '5', '-p', 'Fix TypeScript errors']);
  });
});
```
