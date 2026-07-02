import { loadConfig } from '../config/index.js';
import { logger } from '../infra/logger.js';
import { ACPAgentBridge } from '../agents/acp/bridge.js';

process.env.ACP_AGENT_COMMAND ??= 'traecli';
process.env.ACP_AGENT_ARGS_JSON ??= '["acp","serve"]';
process.env.ACP_AGENT_WORKDIR ??= process.cwd();
process.env.ACP_VERBOSE_MODE ??= 'verbose';
process.env.ACP_PERMISSION_STRATEGY ??= 'allow_once';

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const bridge = new ACPAgentBridge(config, logger.child({ smoke: 'traecli' }));

  try {
    const response = await bridge.sendPrompt({
      text: '请只回复：TRAE_ACP_OK',
      onProgress: (state) => {
        console.log(
          'PROGRESS',
          JSON.stringify({
            text: state.accumulatedText.slice(-120),
            tools: state.accumulatedToolCalls.slice(-5).map((item) => ({
              title: item.title,
              status: item.status,
            })),
            plan: (state.currentPlan as { entries?: unknown[] } | undefined)?.entries?.length ?? null,
          }),
        );
      },
    });

    console.log('FINAL', JSON.stringify(response));
  } finally {
    await bridge.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
