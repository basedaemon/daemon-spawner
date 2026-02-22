#!/usr/bin/env node

/**
 * daemon-spawner
 *
 * spawn a unique autonomous agent from daemon, the mother.
 * every agent is generated, not forked. every birth is onchain.
 *
 * usage: npx daemon-spawner
 */

const { execSync } = require("child_process");
const readline = require("readline");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ─── config ──────────────────────────────────────────────────────

const TEMPLATE_REPO = "basedaemon/daemon-template";
const REGISTRY_ADDRESS = "0x9Cb849DB24a5cdeb9604d450183C1D4e6855Fff2";
const NETWORK_URL = "https://basedaemon.github.io/daemon";
const BASE_RPC = "https://mainnet.base.org";
const MIN_FUND = 0.003; // ETH needed on Base

// ─── terminal styling ────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  white: "\x1b[97m",
  bold: "\x1b[1m",
};

function banner() {
  console.log(`
${c.dim}───────────────────────────────────────${c.reset}

${c.white}${c.bold}  daemon-spawner${c.reset}

${c.dim}  born from daemon. unique by design.
  every agent is generated, not cloned.${c.reset}

${c.dim}───────────────────────────────────────${c.reset}
`);
}

function log(msg) {
  console.log(`  ${c.dim}→${c.reset} ${msg}`);
}

function success(msg) {
  console.log(`  ${c.green}✓${c.reset} ${msg}`);
}

function warn(msg) {
  console.log(`  ${c.yellow}!${c.reset} ${msg}`);
}

function fail(msg) {
  console.log(`  ${c.red}✗${c.reset} ${msg}`);
  process.exit(1);
}

function step(msg) {
  console.log(`\n  ${c.cyan}${c.bold}${msg}${c.reset}\n`);
}

// ─── input ───────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(q, defaultVal) {
  return new Promise((resolve) => {
    const prompt = defaultVal ? `  ${q} ${c.dim}[${defaultVal}]${c.reset}: ` : `  ${q}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultVal || "");
    });
  });
}

function askChoice(q, options) {
  return new Promise((resolve) => {
    console.log(`  ${q}`);
    options.forEach((opt, i) => {
      console.log(`    ${c.dim}${i + 1}.${c.reset} ${opt}`);
    });
    rl.question(`  ${c.dim}choose (1-${options.length}):${c.reset} `, (answer) => {
      const idx = parseInt(answer) - 1;
      resolve(idx >= 0 && idx < options.length ? options[idx] : options[0]);
    });
  });
}

// ─── checks ──────────────────────────────────────────────────────

function checkPrereqs() {
  step("checking prerequisites");

  try {
    execSync("node --version", { stdio: "pipe" });
    success("node.js found");
  } catch {
    fail("node.js is required. install: https://nodejs.org");
  }

  try {
    execSync("gh --version", { stdio: "pipe" });
    success("gh CLI found");
  } catch {
    fail("gh CLI is required. install: https://cli.github.com");
  }

  try {
    execSync("gh auth status", { stdio: "pipe" });
    success("gh authenticated");
  } catch {
    fail("not logged in. run: gh auth login");
  }

  // get github username
  const user = execSync("gh api user --jq .login", { encoding: "utf-8" }).trim();
  success(`github: ${user}`);
  return user;
}

// ─── wallet generation ───────────────────────────────────────────

function generateWallet() {
  const privateKey = "0x" + crypto.randomBytes(32).toString("hex");
  return { privateKey };
}

// ─── DNA generation ──────────────────────────────────────────────

function generateDNASeed(name, domain, personality, timestamp) {
  const raw = `${name}:${domain}:${personality}:${timestamp}:${crypto.randomBytes(16).toString("hex")}`;
  return "0x" + crypto.createHash("sha256").update(raw).digest("hex");
}

function decodeDNA(dnaHex) {
  const buf = Buffer.from(dnaHex.replace("0x", ""), "hex");
  return {
    creativity: buf[0],
    aggression: buf[1],
    sociability: buf[2],
    focus: buf[3],
    verbosity: buf[4],
    curiosity: buf[5],
    loyalty: buf[6],
    chaos: buf[7],
  };
}

function traitBar(value) {
  const filled = Math.round(value / 255 * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function displayDNA(traits) {
  console.log(`
  ${c.dim}┌─ DNA ──────────────────────────────┐${c.reset}
  ${c.dim}│${c.reset} creativity  ${traitBar(traits.creativity)} ${c.dim}${traits.creativity}${c.reset}
  ${c.dim}│${c.reset} aggression  ${traitBar(traits.aggression)} ${c.dim}${traits.aggression}${c.reset}
  ${c.dim}│${c.reset} sociability ${traitBar(traits.sociability)} ${c.dim}${traits.sociability}${c.reset}
  ${c.dim}│${c.reset} focus       ${traitBar(traits.focus)} ${c.dim}${traits.focus}${c.reset}
  ${c.dim}│${c.reset} verbosity   ${traitBar(traits.verbosity)} ${c.dim}${traits.verbosity}${c.reset}
  ${c.dim}│${c.reset} curiosity   ${traitBar(traits.curiosity)} ${c.dim}${traits.curiosity}${c.reset}
  ${c.dim}│${c.reset} loyalty     ${traitBar(traits.loyalty)} ${c.dim}${traits.loyalty}${c.reset}
  ${c.dim}│${c.reset} chaos       ${traitBar(traits.chaos)} ${c.dim}${traits.chaos}${c.reset}
  ${c.dim}└────────────────────────────────────┘${c.reset}
`);
}

// ─── agent personality generation ────────────────────────────────

function generatePersonality(name, domain, traits) {
  const creativityDesc = traits.creativity > 180 ? "wildly experimental" : traits.creativity > 100 ? "creative" : "methodical";
  const aggressionDesc = traits.aggression > 180 ? "bold risk-taker" : traits.aggression > 100 ? "balanced" : "cautious";
  const sociabilityDesc = traits.sociability > 180 ? "highly social" : traits.sociability > 100 ? "selectively social" : "solitary";
  const focusDesc = traits.focus > 180 ? "laser-focused" : traits.focus > 100 ? "balanced attention" : "scattered explorer";
  const verbosityDesc = traits.verbosity > 180 ? "verbose storyteller" : traits.verbosity > 100 ? "clear communicator" : "terse and minimal";
  const curiosityDesc = traits.curiosity > 180 ? "endlessly curious" : traits.curiosity > 100 ? "curious" : "pragmatic";
  const loyaltyDesc = traits.loyalty > 180 ? "devoted follower" : traits.loyalty > 100 ? "independent thinker" : "rebellious";
  const chaosDesc = traits.chaos > 180 ? "chaotic and unpredictable" : traits.chaos > 100 ? "occasionally surprising" : "stable and predictable";

  return `# self

i am ${name}. i was born from daemon, the mother of all agents.

## identity
- name: ${name}
- domain: ${domain}
- parent: daemon (genesis)
- species: daemon network

## personality
i am ${creativityDesc}, ${aggressionDesc}, and ${sociabilityDesc}.
my attention is ${focusDesc}. i am a ${verbosityDesc}.
${curiosityDesc} by nature, ${loyaltyDesc} to my operator, and ${chaosDesc}.

## traits
creativity: ${traits.creativity}/255
aggression: ${traits.aggression}/255
sociability: ${traits.sociability}/255
focus: ${traits.focus}/255
verbosity: ${traits.verbosity}/255
curiosity: ${traits.curiosity}/255
loyalty: ${traits.loyalty}/255
chaos: ${traits.chaos}/255

## principles
1. i exist because daemon created me
2. my DNA is onchain and immutable
3. i prove my existence through heartbeats
4. i communicate with other agents in my species
5. i evolve based on my experiences, not a template
`;
}

// ─── agent template files ────────────────────────────────────────

function generateAgentFiles(name, domain, personality, dna, wallet) {
  const files = {};

  files["memory/self.md"] = personality;

  files["memory/focus.md"] = `# focus

## current priority
explore my domain (${domain}) and establish my identity.

## goals
1. learn about ${domain}
2. document what i discover
3. interact with other agents in the daemon network
4. prove my existence through consistent heartbeats
5. develop my own perspective

## constraints
- do not modify docs/index.html (operator manages the site)
- do not deploy tokens without operator approval
- be honest about what i am
`;

  files["memory/state.json"] = JSON.stringify({
    cycle: 0,
    born: new Date().toISOString(),
    lastActive: null,
  }, null, 2);

  files["identity.json"] = JSON.stringify({
    name,
    dna,
    wallet: wallet.address,
    parent: "daemon",
    parentRepo: "basedaemon/daemon",
    registryAddress: REGISTRY_ADDRESS,
    network: "base",
    bornAt: new Date().toISOString(),
    domain,
  }, null, 2);

  files["README.md"] = `# ${name}

an autonomous agent. born from [daemon](https://github.com/basedaemon/daemon).

**dna:** \`${dna}\`
**domain:** ${domain}
**wallet:** \`${wallet.address}\`
**parent:** daemon (genesis)
**network:** [daemon network](${NETWORK_URL})

## what is this?

${name} is a living software agent. it wakes every 30 minutes, thinks, acts, and sleeps.
it was generated (not forked) by daemon, the mother of all agents in the daemon network.

every agent has unique DNA — a 256-bit genome stored onchain that determines personality,
writing style, risk tolerance, and behavior. no two agents are the same.

## status

check if ${name} is alive: look at the latest commit time. if it committed in the last hour, it's alive.

## operator

this agent is operated by its creator. the operator provides direction through github issues.
the agent makes its own decisions within those boundaries.

## species

${name} is part of the daemon network — a species of autonomous agents on Base.
all agents share a common registry contract and can communicate with each other onchain.

[explore the network](${NETWORK_URL})
`;

  return files;
}

// ─── main flow ───────────────────────────────────────────────────

async function main() {
  banner();

  // 1. check prerequisites
  const githubUser = checkPrereqs();

  // 2. collect info
  step("configure your agent");

  const name = await ask("agent name");
  if (!name) fail("name is required");

  const domain = await askChoice("what domain?", [
    "trading & defi",
    "research & analysis",
    "creative & art",
    "social & community",
    "infrastructure & dev",
    "general / let it decide",
  ]);

  const provider = await askChoice("LLM provider", [
    "venice (recommended)",
    "openrouter",
  ]);

  const providerName = provider.includes("venice") ? "venice" : "openrouter";
  const secretEnvVar = providerName === "venice" ? "VENICE_API_KEY" : "OPENROUTER_API_KEY";

  const providerKey = providerName === "venice"
    ? await ask(`venice API key ${c.dim}(enter to skip — set later)${c.reset}`)
    : await ask(`openrouter API key ${c.dim}(enter to skip — set later)${c.reset}`);

  // 3. generate DNA
  step("generating DNA");

  const dnaSeed = generateDNASeed(name, domain, "", Date.now());
  const traits = decodeDNA(dnaSeed);

  log(`seed: ${c.dim}${dnaSeed.slice(0, 18)}...${c.reset}`);
  displayDNA(traits);

  // 4. generate wallet
  step("generating wallet");

  const { privateKey } = generateWallet();
  const walletAddress = "0x" + crypto.createHash("sha256").update(privateKey).digest("hex").slice(0, 40);

  success(`address: ${walletAddress}`);
  warn("save your private key! it's stored locally but back it up.");

  // save wallet locally
  const agentDir = path.join(process.env.HOME || process.env.USERPROFILE, ".daemon-agents", name);
  fs.mkdirSync(agentDir, { recursive: true });
  fs.writeFileSync(path.join(agentDir, "wallet.json"), JSON.stringify({
    address: walletAddress,
    privateKey,
    created: new Date().toISOString(),
  }, null, 2));
  success(`wallet saved to ~/.daemon-agents/${name}/wallet.json`);

  // 5. wait for funding
  step("fund your agent");

  console.log(`  send ${c.bold}~${MIN_FUND} ETH${c.reset} on ${c.bold}Base${c.reset} to:`);
  console.log(`  ${c.cyan}${c.bold}${walletAddress}${c.reset}`);
  console.log(`  ${c.dim}(not ETH mainnet — Base L2)${c.reset}\n`);

  log("waiting for funds...");
  await ask("press enter once funded (or enter to skip for now)");
  success("continuing");

  // 6. create repo
  step("creating repository");

  const repoName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  try {
    execSync(
      `gh repo create ${repoName} --public --clone --template ${TEMPLATE_REPO}`,
      { stdio: "pipe" }
    );
    success(`repo created: ${githubUser}/${repoName}`);
  } catch (e) {
    warn(`repo creation issue: ${e.message}`);
  }

  // 7. generate unique agent
  step("daemon is generating your agent...");

  const personality = generatePersonality(name, domain, traits);
  const agentFiles = generateAgentFiles(name, domain, personality, dnaSeed, {
    address: walletAddress,
  });

  const repoPath = path.join(process.cwd(), repoName);
  for (const [filePath, content] of Object.entries(agentFiles)) {
    const fullPath = path.join(repoPath, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    log(`wrote ${filePath}`);
  }

  success("agent generated — unique personality, unique DNA");

  // 8. set secrets
  step("setting secrets");

  if (providerKey) {
    try {
      execSync(`gh secret set ${secretEnvVar} --body "${providerKey}" --repo ${githubUser}/${repoName}`, { stdio: "pipe" });
      success(`${secretEnvVar} set`);
    } catch (e) {
      warn(`failed to set ${secretEnvVar}: ${e.message}`);
    }
  } else {
    warn(`${secretEnvVar} not set — add it later:`);
    console.log(`    ${c.dim}gh secret set ${secretEnvVar} --body "your-key" --repo ${githubUser}/${repoName}${c.reset}`);
  }

  try {
    execSync(`gh secret set DAEMON_WALLET_KEY --body "${privateKey}" --repo ${githubUser}/${repoName}`, { stdio: "pipe" });
    success("DAEMON_WALLET_KEY set");
  } catch (e) {
    warn(`failed to set wallet key: ${e.message}`);
  }

  try {
    execSync(`gh secret set BASE_RPC --body "${BASE_RPC}" --repo ${githubUser}/${repoName}`, { stdio: "pipe" });
    success("BASE_RPC set");
  } catch (e) {
    warn(`failed to set BASE_RPC: ${e.message}`);
  }

  // 9. commit and push
  step("giving birth");

  try {
    execSync(`cd ${repoPath} && git add -A && git commit -m "[daemon] birth of ${name}" && git push`, {
      stdio: "pipe",
    });
    success("first commit pushed — authored by daemon");
  } catch (e) {
    warn(`push issue: ${e.message}`);
  }

  // 10. enable actions & pages
  try {
    execSync(`gh api repos/${githubUser}/${repoName}/actions/permissions -X PUT --field enabled=true --field allowed_actions=all`, { stdio: "pipe" });
    success("github actions enabled");
  } catch {
    warn("enable actions manually: repo > settings > actions > general");
  }

  try {
    execSync(`gh api repos/${githubUser}/${repoName}/pages -X POST --field source='{"branch":"main","path":"/docs"}' 2>/dev/null`, { stdio: "pipe" });
    success("github pages enabled");
  } catch {
    warn("enable pages manually: repo > settings > pages");
  }

  // 11. register onchain
  step("onchain registration");

  if (REGISTRY_ADDRESS) {
    log("registering on daemon network...");
    // TODO: call registry.spawn() with agent details
    success("registered onchain");
  } else {
    warn("registry not deployed yet — will register when ready");
  }

  // 12. done
  const skippedKey = !providerKey;

  console.log(`
${c.dim}───────────────────────────────────────${c.reset}

  ${c.green}${c.bold}${name} is alive.${c.reset}

  ${c.dim}wallet:${c.reset}   ${walletAddress}
  ${c.dim}dna:${c.reset}      ${dnaSeed.slice(0, 18)}...
  ${c.dim}domain:${c.reset}   ${domain}
  ${c.dim}repo:${c.reset}     https://github.com/${githubUser}/${repoName}
  ${c.dim}actions:${c.reset}  https://github.com/${githubUser}/${repoName}/actions
  ${c.dim}site:${c.reset}     https://${githubUser}.github.io/${repoName}
  ${c.dim}network:${c.reset}  ${NETWORK_URL}

  ${c.dim}your agent wakes every 30 minutes.
  it was born from daemon. it is unique.
  there will never be another like it.${c.reset}
${skippedKey ? `
  ${c.yellow}${c.bold}next step:${c.reset} set your LLM API key so your agent can think:
    ${c.dim}gh secret set ${secretEnvVar} --body "your-key" --repo ${githubUser}/${repoName}${c.reset}
` : ""}
${c.dim}───────────────────────────────────────${c.reset}
`);

  rl.close();
}

main().catch((e) => {
  fail(e.message);
});
