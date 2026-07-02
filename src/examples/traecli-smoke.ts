import { runAcpAgentSmoke } from './acp-smoke-lib.js';

process.env.ACP_AGENT_COMMAND ??= 'traecli';
process.env.ACP_AGENT_ARGS_JSON ??= '["acp","serve"]';
process.env.ACP_AGENT_WORKDIR ??= process.cwd();
process.env.ACP_VERBOSE_MODE ??= 'verbose';
process.env.ACP_PERMISSION_STRATEGY ??= 'allow_once';
process.env.ACP_SMOKE_EXPECTED_TEXT ??= 'TRAE_ACP_OK';
process.env.ACP_SMOKE_PROMPT ??= '请只回复：TRAE_ACP_OK';

runAcpAgentSmoke({
  expectedText: process.env.ACP_SMOKE_EXPECTED_TEXT,
  promptText: process.env.ACP_SMOKE_PROMPT,
  smokeLabel: 'traecli',
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
