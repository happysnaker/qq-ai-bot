import { describe, expect, it } from 'vitest';
import { buildNapcatLoader } from './napcat-loader.js';
import { isQQAlreadyPatched, isQQProcessCommand } from './qq-bot-macos.js';

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

  it('up flow should stop QQ before patching the app bundle', () => {
    const orderedSteps = [
      'stopQQ',
      'ensureNapcatPatched',
      'stopBot',
      'startBot',
      'launchQQ',
    ];

    expect(orderedSteps.indexOf('stopQQ')).toBeLessThan(orderedSteps.indexOf('ensureNapcatPatched'));
  });

  it('treats helper processes as active QQ processes', () => {
    expect(isQQProcessCommand('/Applications/QQ.app/Contents/MacOS/QQ')).toBe(true);
    expect(
      isQQProcessCommand('/Applications/QQ.app/Contents/Frameworks/QQ Helper.app/Contents/MacOS/QQ Helper'),
    ).toBe(true);
    expect(
      isQQProcessCommand('/Applications/QQ.app/Contents/MacOS/QQEXDOC.app/Contents/MacOS/QQEXDOC'),
    ).toBe(true);
    expect(isQQProcessCommand('/Applications/Cursor.app/Contents/MacOS/Cursor')).toBe(false);
  });

  it('detects an already patched QQ package', () => {
    expect(
      isQQAlreadyPatched(
        {
          main: '../../../../../Users/bytedance/Library/Containers/com.tencent.qq/Data/Documents/loadNapCat.js',
        },
        '../../../../../Users/bytedance/Library/Containers/com.tencent.qq/Data/Documents/loadNapCat.js',
      ),
    ).toBe(true);
    expect(isQQAlreadyPatched({ main: './app_launcher/index.js' }, 'loadNapCat.js')).toBe(false);
  });

  it('no longer hardcodes machine-specific trae binary paths in the helper source', async () => {
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('./qq-bot-macos.ts', import.meta.url), 'utf8'),
    );

    expect(source).not.toContain('/Users/bytedance/.local/bin/traex');
    expect(source).not.toContain('/Users/bytedance/GolandProjects/DevPlan');
    expect(source).toContain("const DEFAULT_AGENT_COMMAND = 'traex';");
    expect(source).toContain("const DEFAULT_GROUP_CONFIG = './examples/group-rules.local.json';");
  });

  it('prints terminal QR code by default and keeps JSON as an explicit mode', async () => {
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('./qq-bot-macos.ts', import.meta.url), 'utf8'),
    );

    expect(source).toContain('Scan this QR code with the QQ account you want the bot to use');
    expect(source).toContain('renderTerminalQr');
    expect(source).toContain(\"case '--json'\");
    expect(source).toContain(\"case '--no-wait'\");
  });
});
