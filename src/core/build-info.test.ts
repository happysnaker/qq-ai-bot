import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getBuildInfo } from './build-info.js';

function currentPackageVersion(): string {
  const raw = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

describe('getBuildInfo', () => {
  it('returns package version and optional build metadata', () => {
    const info = getBuildInfo({
      APP_GIT_COMMIT: 'abc123',
      APP_BUILD_REF: 'release-2026-07-02',
    } as NodeJS.ProcessEnv);

    expect(info.appName).toBe('qq-ai-bot');
    expect(info.version).toBe(currentPackageVersion());
    expect(info.gitCommit).toBe('abc123');
    expect(info.buildRef).toBe('release-2026-07-02');
    expect(typeof info.startedAt).toBe('string');
    expect(info.startedAt.length).toBeGreaterThan(10);
  });
});
