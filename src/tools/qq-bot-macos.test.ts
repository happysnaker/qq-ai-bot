import { describe, expect, it } from 'vitest';
import { buildNapcatLoader } from './napcat-loader.js';

describe('qq-bot-macos orchestration assumptions', () => {
  it('can build a QR-login loader without quick account injection', () => {
    const loader = buildNapcatLoader({
      qqPackagePath: '/Applications/QQ.app/Contents/Resources/app/package.json',
      qqResourcesDir: '/Applications/QQ.app/Contents/Resources/app',
      napcatShellDir: '/Users/bytedance/Library/Containers/com.tencent.qq/Data/Documents/napcat',
    });

    expect(loader).not.toContain('NAPCAT_QUICK_ACCOUNT');
    expect(loader).toContain('}, 3000);');
  });

  it('can build a quick-login loader with delayed UI startup', () => {
    const loader = buildNapcatLoader(
      {
        qqPackagePath: '/Applications/QQ.app/Contents/Resources/app/package.json',
        qqResourcesDir: '/Applications/QQ.app/Contents/Resources/app',
        napcatShellDir: '/Users/bytedance/Library/Containers/com.tencent.qq/Data/Documents/napcat',
      },
      { quickAccount: '3765026549' },
    );

    expect(loader).toContain('NAPCAT_QUICK_ACCOUNT');
    expect(loader).toContain('}, 8000);');
  });
});
