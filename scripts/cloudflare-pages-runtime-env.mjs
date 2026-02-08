#!/usr/bin/env node

/**
 * Upsert Cloudflare Pages runtime env vars for Production/Preview and validate public API endpoints.
 *
 * Requirements:
 * - Node.js >= 18 (native fetch).
 * - CLOUDFLARE_API_TOKEN with Pages edit permissions.
 * - CLOUDFLARE_ACCOUNT_ID
 */

const API_BASE = "https://api.cloudflare.com/client/v4";

function parseArgs(argv) {
  const args = {
    project: "tagil.pizza",
    productionDomain: "https://tagil.pizza",
    applyPreview: true,
    dryRun: false,
    deploy: false,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--project") args.project = argv[++i];
    else if (token === "--production-domain") args.productionDomain = argv[++i];
    else if (token === "--supabase-url") args.supabaseUrl = argv[++i];
    else if (token === "--supabase-anon-key") args.supabaseAnonKey = argv[++i];
    else if (token === "--no-preview") args.applyPreview = false;
    else if (token === "--dry-run") args.dryRun = true;
    else if (token === "--deploy") args.deploy = true;
    else if (token === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function redacted(value) {
  if (!value) return "<empty>";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function assertRequired(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
}

async function cfRequest({ accountId, token, method, path, body }) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();

  if (!response.ok || payload?.success === false) {
    throw new Error(`Cloudflare API ${method} ${path} failed: HTTP ${response.status} ${JSON.stringify(payload?.errors ?? payload)}`);
  }

  return payload.result;
}

function mergeRuntimeVars(config, vars) {
  const current = config?.env_vars ?? {};

  return {
    ...current,
    SUPABASE_URL: {
      type: "plain_text",
      value: vars.supabaseUrl,
    },
    SUPABASE_ANON_KEY: {
      type: "plain_text",
      value: vars.supabaseAnonKey,
    },
  };
}

async function updateProjectRuntimeVars({ accountId, token, projectName, vars, applyPreview, dryRun }) {
  const project = await cfRequest({
    accountId,
    token,
    method: "GET",
    path: `/pages/projects/${projectName}`,
  });

  const deploymentConfigs = project.deployment_configs ?? {};
  const production = deploymentConfigs.production ?? {};
  const preview = deploymentConfigs.preview ?? {};

  const nextProductionVars = mergeRuntimeVars(production, vars);
  const nextPreviewVars = mergeRuntimeVars(preview, vars);

  const patchPayload = {
    deployment_configs: {
      production: {
        ...production,
        env_vars: nextProductionVars,
      },
      ...(applyPreview
        ? {
            preview: {
              ...preview,
              env_vars: nextPreviewVars,
            },
          }
        : {}),
    },
  };

  if (dryRun) {
    return {
      updated: false,
      patchPayload,
    };
  }

  await cfRequest({
    accountId,
    token,
    method: "PATCH",
    path: `/pages/projects/${projectName}`,
    body: patchPayload,
  });

  return {
    updated: true,
    patchPayload,
  };
}

async function triggerDeploy({ projectName }) {
  const { spawn } = await import("node:child_process");

  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["wrangler", "pages", "deploy", "dist", "--project-name", projectName], {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wrangler deploy exited with code ${code}`));
    });
  });
}

async function checkEndpoint(url, predicate) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`${url} did not return valid JSON. Status=${response.status}, body=${text.slice(0, 200)}`);
  }

  if (response.status !== 200) {
    throw new Error(`${url} expected HTTP 200, got ${response.status}. body=${JSON.stringify(payload)}`);
  }

  predicate(payload);

  return payload;
}

function printHelp() {
  console.log(`Usage: node scripts/cloudflare-pages-runtime-env.mjs [options]\n
Options:
  --project <name>                Pages project name (default: tagil.pizza)
  --production-domain <url>       Production domain for smoke checks (default: https://tagil.pizza)
  --supabase-url <url>            Runtime SUPABASE_URL (or env SUPABASE_URL)
  --supabase-anon-key <key>       Runtime SUPABASE_ANON_KEY (or env SUPABASE_ANON_KEY)
  --no-preview                    Do not copy vars to Preview deployment config
  --deploy                        Trigger wrangler deploy from local dist/
  --dry-run                       Print intended PATCH payload, do not mutate Cloudflare
  --help                          Show this message

Required env vars:
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  assertRequired("SUPABASE_URL", args.supabaseUrl);
  assertRequired("SUPABASE_ANON_KEY", args.supabaseAnonKey);

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  assertRequired("CLOUDFLARE_API_TOKEN", cfToken);
  assertRequired("CLOUDFLARE_ACCOUNT_ID", cfAccountId);

  console.log(`Project: ${args.project}`);
  console.log(`SUPABASE_URL: ${args.supabaseUrl}`);
  console.log(`SUPABASE_ANON_KEY: ${redacted(args.supabaseAnonKey)}`);
  console.log(`Apply to Preview: ${args.applyPreview ? "yes" : "no"}`);
  console.log(`Dry-run: ${args.dryRun ? "yes" : "no"}`);

  const updateResult = await updateProjectRuntimeVars({
    accountId: cfAccountId,
    token: cfToken,
    projectName: args.project,
    vars: {
      supabaseUrl: args.supabaseUrl,
      supabaseAnonKey: args.supabaseAnonKey,
    },
    applyPreview: args.applyPreview,
    dryRun: args.dryRun,
  });

  if (args.dryRun) {
    console.log("\n[DRY-RUN] Patch payload:");
    console.log(JSON.stringify(updateResult.patchPayload, null, 2));
    return;
  }

  console.log("Runtime vars updated in Pages project deployment configs.");

  if (args.deploy) {
    console.log("Triggering new Pages deployment from dist/ ...");
    await triggerDeploy({ projectName: args.project });
  }

  const healthUrl = `${args.productionDomain}/api/health`;
  const menuUrl = `${args.productionDomain}/api/menu`;

  const healthPayload = await checkEndpoint(healthUrl, (payload) => {
    if (payload?.ok !== true) {
      throw new Error(`${healthUrl} expected { ok: true }, got ${JSON.stringify(payload)}`);
    }
  });

  const menuPayload = await checkEndpoint(menuUrl, (payload) => {
    if (!Array.isArray(payload?.categories) || !Array.isArray(payload?.items)) {
      throw new Error(`${menuUrl} expected { categories:[], items:[] }, got ${JSON.stringify(payload)}`);
    }
  });

  console.log("Smoke check passed:");
  console.log(`- /api/health => ${JSON.stringify(healthPayload)}`);
  console.log(`- /api/menu => categories=${menuPayload.categories.length}, items=${menuPayload.items.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
