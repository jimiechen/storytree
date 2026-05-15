import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { extractTasksConcurrently } from '../../../scripts/update-plans';

describe('update-plans script', () => {
  const mockDir = path.join(__dirname, '__mock_docs__');
  const dreamweaverDocs = path.join(mockDir, 'dreamweaver', 'docs');
  const caiodeDocs = path.join(mockDir, 'caiode', 'docs');

  beforeEach(async () => {
    await fs.mkdir(dreamweaverDocs, { recursive: true });
    await fs.mkdir(caiodeDocs, { recursive: true });

    // Mock dreamweaver tasks
    await fs.writeFile(
      path.join(dreamweaverDocs, '04-ralph-tasks.md'),
      `
## Sprint 1
- [x] **T-001**: Done task
- [ ] **T-002**: Pending task 1
- [ ] **T-003**: Pending task 2
      `
    );

    // Mock caiode tasks
    await fs.writeFile(
      path.join(caiodeDocs, 'plan.md'),
      `
- [ ] **C-001**: Caiode pending task
- [x] **C-002**: Caiode done task
      `
    );
  });

  afterEach(async () => {
    await fs.rm(mockDir, { recursive: true, force: true });
  });

  it('should extract pending tasks from both directories concurrently', async () => {
    const result = await extractTasksConcurrently([dreamweaverDocs, caiodeDocs]);
    
    expect(result.length).toBe(2);
    
    const dwResult = result.find(r => r.directory === dreamweaverDocs);
    expect(dwResult).toBeDefined();
    expect(dwResult?.tasks).toContain('- [ ] **T-002**: Pending task 1');
    expect(dwResult?.tasks).toContain('- [ ] **T-003**: Pending task 2');
    expect(dwResult?.tasks).not.toContain('- [x] **T-001**: Done task');

    const caiodeResult = result.find(r => r.directory === caiodeDocs);
    expect(caiodeResult).toBeDefined();
    expect(caiodeResult?.tasks).toContain('- [ ] **C-001**: Caiode pending task');
    expect(caiodeResult?.tasks).not.toContain('- [x] **C-002**: Caiode done task');
  });
});
