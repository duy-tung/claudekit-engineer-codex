#!/usr/bin/env node
/**
 * Tests for session-state.cjs hook cache refresh behavior
 * Run: node --test .claude/hooks/__tests__/session-state.test.cjs
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sanitizeActivitySnapshot } = require('../lib/statusline-session-cache.cjs');

const HOOK_PATH = path.join(__dirname, '..', 'session-state.cjs');
const tempFiles = new Set();

function track(filePath) {
  tempFiles.add(filePath);
  return filePath;
}

afterEach(() => {
  for (const filePath of tempFiles) {
    try { fs.rmSync(filePath, { recursive: true, force: true }); } catch {}
  }
  tempFiles.clear();
});

function runHook(inputData) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      cwd: process.cwd(),
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.stdin.write(JSON.stringify(inputData));
    proc.stdin.end();

    proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code }));
    proc.on('error', reject);

    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Hook execution timed out'));
    }, 5000);
  });
}

describe('session-state.cjs', () => {
  it('refreshes cached session activity on task-related PostToolUse events', async () => {
    const sessionId = `session-state-test-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));

    fs.writeFileSync(transcriptPath, [
      JSON.stringify({
        timestamp: new Date(Date.now() - 100000).toISOString(),
        message: {
          content: [{
            type: 'tool_use',
            id: 'task-create-1',
            name: 'TaskCreate',
            input: { subject: 'Implement startup cache' }
          }]
        }
      }),
      JSON.stringify({
        timestamp: new Date(Date.now() - 90000).toISOString(),
        message: {
          content: [{
            type: 'tool_result',
            tool_use_id: 'task-create-1',
            is_error: false,
            content: '{"taskId":"task-604"}'
          }]
        }
      }),
      JSON.stringify({
        timestamp: new Date(Date.now() - 80000).toISOString(),
        message: {
          content: [{
            type: 'tool_use',
            id: 'task-update-1',
            name: 'TaskUpdate',
            input: {
              taskId: 'task-604',
              status: 'in_progress',
              activeForm: 'Implementing startup cache'
            }
          }]
        }
      })
    ].join('\n'));

    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: new Date(Date.now() - 100000).toISOString(),
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        warmed: false,
        agents: [],
        todos: []
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'TaskUpdate',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    assert.match(result.stdout, /continue/, 'PostToolUse should emit continue payload');

    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.warmed, true, 'Statusline cache should be warmed');
    assert.strictEqual(sessionState.statusline.todos.length, 1, 'Should cache current todo state');
    assert.strictEqual(
      sessionState.statusline.todos[0].activeForm,
      'Implementing startup cache',
      'Should cache native task active form from transcript'
    );
  });

  it('reuses the cached transcript path when SubagentStop omits transcript_path', async () => {
    const sessionId = `session-state-subagent-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 100000).toISOString();

    fs.writeFileSync(transcriptPath, JSON.stringify({
      timestamp: startTs,
      message: {
        content: [{
          type: 'tool_use',
          id: 'agent-1',
          name: 'Task',
          input: { subagent_type: 'researcher', description: 'Research startup regressions' }
        }]
      }
    }) + '\n');

    fs.writeFileSync(sessionPath, JSON.stringify({ statusline: { sessionStart: startTs, updatedAt: startTs, warmed: false, agents: [], todos: [] } }, null, 2));

    await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'Task',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    fs.appendFileSync(transcriptPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      message: {
        content: [{
          type: 'tool_result',
          tool_use_id: 'agent-1',
          is_error: false,
          content: 'done'
        }]
      }
    }) + '\n');

    const result = await runHook({
      hook_event_name: 'SubagentStop',
      session_id: sessionId,
      agent_id: 'agent-1',
      agent_type: 'researcher',
      cwd: process.cwd()
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.lastTranscriptPath, transcriptPath, 'Should persist the transcript path for later refreshes');
    assert.strictEqual(sessionState.statusline.agents[0].status, 'completed', 'Should refresh the cached agent status without a direct transcript_path');
  });

  it('marks the matching agent completed on SubagentStop even without any transcript path', async () => {
    const sessionId = `session-state-stop-${Date.now()}`;
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 120000).toISOString();

    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: startTs,
        updatedAt: startTs,
        warmed: true,
        agents: [{ id: 'agent-99', type: 'tester', status: 'running', startTime: startTs, endTime: null }],
        todos: []
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'SubagentStop',
      session_id: sessionId,
      agent_id: 'agent-99',
      agent_type: 'tester',
      cwd: process.cwd()
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.agents[0].status, 'completed', 'Should complete the cached agent from event metadata alone');
    assert.ok(sessionState.statusline.agents[0].endTime, 'Should stamp an end time when completing the cached agent');
  });

  it('preserves a warmed snapshot when transcript parsing yields no activity', async () => {
    const sessionId = `session-state-malformed-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 90000).toISOString();

    fs.writeFileSync(transcriptPath, '{"timestamp":');
    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: startTs,
        updatedAt: startTs,
        warmed: true,
        agents: [],
        todos: [{ id: 'task-1', content: 'Keep current task', status: 'in_progress', activeForm: 'Keeping current task' }]
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'TaskUpdate',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.todos.length, 1, 'Malformed transcript should not wipe the cached todo list');
    assert.strictEqual(sessionState.statusline.todos[0].activeForm, 'Keeping current task', 'Malformed transcript should preserve the existing active task');
  });

  it('does not truncate todo snapshots', () => {
    const todos = Array.from({ length: 30 }, (_, index) => ({
      id: `task-${index + 1}`,
      content: `Task ${index + 1}`,
      status: index === 0 ? 'in_progress' : 'pending',
      activeForm: index === 0 ? 'Working task 1' : null
    }));

    const snapshot = sanitizeActivitySnapshot({
      sessionStart: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      warmed: true,
      agents: [],
      todos
    });

    assert.strictEqual(snapshot.todos.length, 30, 'Todo cache should keep the full task set');
    assert.strictEqual(snapshot.todos[0].status, 'in_progress', 'Todo cache should preserve the active task');
  });

  it('allows a valid empty TodoWrite snapshot to clear cached todos', async () => {
    const sessionId = `session-state-clear-${Date.now()}`;
    const transcriptPath = track(path.join(os.tmpdir(), `${sessionId}.jsonl`));
    const sessionPath = track(path.join(os.tmpdir(), `ck-session-${sessionId}.json`));
    const startTs = new Date(Date.now() - 90000).toISOString();

    fs.writeFileSync(transcriptPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      message: {
        content: [{
          type: 'tool_use',
          id: 'todo-write-1',
          name: 'TodoWrite',
          input: { todos: [] }
        }]
      }
    }) + '\n');

    fs.writeFileSync(sessionPath, JSON.stringify({
      statusline: {
        sessionStart: startTs,
        updatedAt: startTs,
        warmed: true,
        agents: [],
        todos: [{ id: 'task-old', content: 'Old task', status: 'in_progress', activeForm: 'Old task' }]
      }
    }, null, 2));

    const result = await runHook({
      hook_event_name: 'PostToolUse',
      tool_name: 'TodoWrite',
      session_id: sessionId,
      cwd: process.cwd(),
      transcript_path: transcriptPath
    });

    assert.strictEqual(result.exitCode, 0, 'Hook should exit with code 0');
    const sessionState = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert.strictEqual(sessionState.statusline.todos.length, 0, 'A valid empty TodoWrite should clear the cached todo list');
  });
});
