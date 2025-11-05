#!/usr/bin/env node
// Usage:
//   node scripts/tag-deploy.js <env>         -> create and push the tag
//   node scripts/tag-deploy.js <env> --dry   -> print the tag and commands but don't run

const { execSync } = require("child_process");

function pad(n) {
  return String(n).padStart(2, "0");
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: node scripts/tag-deploy.js <testing|staging|production> [--dry]"
  );
  process.exit(1);
}
const envName = args[0];
const dry = args.includes("--dry");
const allowed = ["testing", "staging", "production"];
if (!allowed.includes(envName)) {
  console.error("Environment must be one of: testing, staging, production");
  process.exit(1);
}

const d = new Date();
const year = d.getUTCFullYear();
const month = pad(d.getUTCMonth() + 1);

// Find latest tag for this env and year-month
const pattern = `${envName}-${year}-${month}-v*`;
let latest = null;
// Use --sort=-version:refname to get highest semantic-like version
const out = execSync(`git tag -l "${pattern}" --sort=-version:refname`, {
  encoding: "utf8",
}).trim();
if (out) latest = out.split("\n")[0].trim();

const current = latest.match(/-v(\d+)$/);
const next = current && current[1] ? parseInt(current[1], 10) + 1 : 1;

const tag = `${envName}-${year}-${month}-v${next}`;

const cmds = [`git tag ${tag}`, `git push origin ${tag}`];

console.log(`Environment: ${envName}`);
console.log(`Latest tag found: ${latest || "<none>"}`);
console.log(`New tag: ${tag}`);

if (dry) {
  console.log("\nDry run - commands that would run:");
  cmds.forEach((c) => console.log(c));
  process.exit(0);
}

try {
  console.log("\nCreating tag...");
  execSync(cmds[0], { stdio: "inherit" });
  console.log("\nPushing tag...");
  execSync(cmds[1], { stdio: "inherit" });
  console.log("\nDone.");
} catch (err) {
  console.error("\nCommand failed:", err.message || err);
  process.exit(1);
}
