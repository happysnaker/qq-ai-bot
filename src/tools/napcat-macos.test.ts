import { describe, expect, it } from 'vitest';
import { buildNapcatLoader } from './napcat-loader.js';

describe('NapCat macOS launcher mode switch', () => {
  it('always loads both QQ launcher and NapCat shell', () => {
    const loader = buildNapcatLoader({
      qqPackagePath: '/Applications/QQ.app/Contents/Resources/app/package.json',
      qqResourcesDir: '/Applications/QQ.app/Contents/Resources/app',
      napcatShellDir: '/Users/bytedance/Library/Containers/com.tencent.qq/Data/Documents/napcat',
    });

    expect(loader).toContain('require("/Applications/QQ.app/Contents/Resources/app/app_launcher/index.js")');
    expect(loader).toContain('await import("file:///Users/bytedance/Library/Containers/com.tencent.qq/Data/Documents/napcat/napcat.mjs")');
    expect(loader).not.toContain('process.argv.includes(');
    expect(loader).not.toContain('if (hasNapcatParam)');
    expect(loader).toContain('}, 3000);');
  });

  it('injects quick account and longer launcher delay when requested', () => {
    const loader = buildNapcatLoader(
      {
        qqPackagePath: '/Applications/QQ.app/Contents/Resources/app/package.json',
        qqResourcesDir: '/Applications/QQ.app/Contents/Resources/app',
        napcatShellDir: '/Users/bytedance/Library/Containers/com.tencent.qq/Data/Documents/napcat',
      },
      {
        quickAccount: '3765026549',
      },
    );

    expect(loader).toContain('process.env.NAPCAT_QUICK_ACCOUNT = process.env.NAPCAT_QUICK_ACCOUNT || "3765026549";');
    expect(loader).toContain('}, 8000);');
  });
});
