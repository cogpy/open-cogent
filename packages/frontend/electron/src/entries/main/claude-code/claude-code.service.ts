import { Injectable, Logger } from '@nestjs/common';
import { app, net } from 'electron';
import execa from 'execa';

import { IpcHandle, IpcScope } from '../../../ipc';

export interface ComputerUseCCRequest {
  type: 'computer-use-cc-request';
  taskId: string;
  prompt?: string;
  phase?: 'discover' | 'execute';
  allowedTools?: string[];
  workingDirectory?: string;
  contextFiles?: string[];
}

@Injectable()
export class ClaudeCodeService {
  private readonly logger = new Logger('ClaudeCodeService');

  /**
   * Executes Claude Code CLI based on the request coming from renderer.
   * The IPC channel is automatically derived as `claudeCode:execute`.
   */
  @IpcHandle({ scope: IpcScope.CLAUDE_CODE, name: 'execute' })
  async execute(req: ComputerUseCCRequest): Promise<{
    status: 'completed' | 'failed';
    output: string;
    exitCode: number;
  }> {
    const { prompt, taskId, phase = 'execute', allowedTools } = req;
    const homeDir = app.getPath('home');
    const cwd = req.workingDirectory || homeDir;

    const args = this.buildArgsForPhase(
      phase,
      cwd,
      prompt,
      allowedTools,
      req.contextFiles ?? []
    );

    this.logger.log(
      `Executing Claude Code CLI for task ${taskId}: claude ${args.join(' ')}`
    );

    try {
      const { stdout, stderr, exitCode } = await this.runClaude(args, cwd);
      const output = stdout + (stderr ? `\n${stderr}` : '');
      if (phase === 'discover') {
        await this.handleDiscover(taskId, output, exitCode);
        return { status: 'completed', output, exitCode: exitCode ?? 0 };
      }
      const status: 'completed' | 'failed' =
        (exitCode ?? 0) === 0 ? 'completed' : 'failed';
      await this.handleExecute(taskId, output, exitCode);
      return { status, output, exitCode: exitCode ?? 0 };
    } catch (err: any) {
      const exitCode = err.exitCode ?? -1;
      const output = (err.stdout ?? '') + (err.stderr ? `\n${err.stderr}` : '');
      this.logger.error(`Claude CLI execution error for task ${taskId}`, err);
      if (phase === 'discover' && taskId) {
        await this.postCallback({ taskId, status: 'discovered', output });
      } else if (taskId) {
        await this.postCallback({ taskId, status: 'failed', output });
      }
      return { status: 'failed', output, exitCode };
    }
  }

  private async postCallback(payload: any) {
    const serverOrigin = 'http://localhost:3010';
    const url = `${serverOrigin}/api/copilot/computer-use-cc/callback`;
    try {
      await net.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.logger.error('Failed to POST callback to backend', err);
    }
  }

  private buildArgsForPhase(
    phase: 'discover' | 'execute',
    cwd: string,
    prompt?: string,
    allowedTools?: string[],
    contextFiles: string[] = []
  ): string[] {
    const args: string[] = [];
    if (phase === 'discover') {
      args.push('mcp', 'list');
    } else {
      if (allowedTools && allowedTools.length > 0) {
        args.push('--allowedTools', allowedTools.join(','));
      }
      if (prompt && prompt.length > 0) {
        args.push('-p', JSON.stringify(prompt));
      }
      args.push('--add-dir', cwd);
      args.push('--dangerously-skip-permissions');
    }
    contextFiles.forEach(f => args.push('--file', f));
    return args;
  }

  private async runClaude(
    args: string[],
    cwd: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number | undefined }> {
    const claudeBin = this.getClaudeBin();
    const { stdout, stderr, exitCode } = await execa(
      process.execPath,
      [claudeBin, ...args],
      {
        cwd,
        stdin: 'ignore',
        env: { PATH: process.env.PATH },
      }
    );
    return { stdout, stderr, exitCode };
  }

  private async handleDiscover(
    taskId: string,
    stdout: string,
    exitCode?: number
  ): Promise<void> {
    let tools: Array<{
      name: string;
      title?: string;
      serverId?: string;
      vendor?: string;
    }> = [];
    try {
      const parsed = JSON.parse(stdout);
      tools = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as any)?.tools)
          ? (parsed as any).tools
          : [];
    } catch {
      tools = this.parseMcpList(stdout);
    }
    await this.postCallback({
      taskId,
      status: 'discovered',
      output: stdout,
      tools,
    });
    this.logTaskFinish(taskId, 'discover', exitCode, `tools=${tools.length}`);
    this.logger.log(
      `Found ${tools.length} tools, ${tools.map(t => t.name).join(', ')}`
    );
  }

  private async handleExecute(
    taskId: string,
    stdout: string,
    exitCode?: number
  ): Promise<void> {
    const status: 'completed' | 'failed' =
      (exitCode ?? 0) === 0 ? 'completed' : 'failed';
    await this.postCallback({ taskId, status, output: stdout });
    this.logTaskFinish(taskId, 'execute', exitCode, `output=${stdout}`);
  }

  private logTaskFinish(
    taskId: string,
    phase: 'discover' | 'execute',
    exitCode?: number,
    extra?: string
  ) {
    const code = exitCode ?? -1;
    const status: 'completed' | 'failed' = code === 0 ? 'completed' : 'failed';
    const suffix = extra ? ` ${extra}` : '';
    this.logger.log(
      `Claude Code task ${taskId} phase=${phase} status=${status} exitCode=${code}${suffix}`
    );
  }

  private parseMcpList(output: string): Array<{
    name: string;
    title?: string;
    serverId?: string;
    vendor?: string;
  }> {
    const tools: Array<{
      name: string;
      title?: string;
      serverId?: string;
      vendor?: string;
    }> = [];
    const lines = output.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      // Example: "gmail: npx @gongrzhe/server-gmail-autoauth-mcp - ✓ Connected"
      // or: "gmail: ... - Connected"
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) continue;
      const name = match[1].trim();
      const rest = match[2] ?? '';
      const isConnected =
        /(^|\b)(connected|running|ready)(\b|$)/i.test(rest) || /✓/u.test(rest);
      if (isConnected && name) {
        tools.push({ name });
      }
    }
    // Deduplicate
    const uniqued = Array.from(new Map(tools.map(t => [t.name, t])).values());
    return uniqued;
  }

  private getClaudeBin(): string {
    const cliPath = require.resolve('@anthropic-ai/claude-code/cli.js');
    return cliPath;
  }
}
