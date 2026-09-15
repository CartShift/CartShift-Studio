import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const IGNORED_PREFIXES = [".github/", "docs/", "tests/"];
const IGNORED_EXACT = new Set(["README.md", "DESIGN.md"]);

export function isDeploymentNeutralPath(path) {
  if (!path) return true;
  if (IGNORED_EXACT.has(path)) return true;
  return IGNORED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function shouldIgnoreDeployment(paths) {
  return paths.length > 0 && paths.every(isDeploymentNeutralPath);
}

export function changedFiles(previousSha, head = "HEAD") {
  if (!previousSha || !/^[a-f0-9]{7,40}$/i.test(previousSha)) {
    throw new Error("VERCEL_GIT_PREVIOUS_SHA is unavailable or invalid");
  }

  return execFileSync("git", ["diff", "--name-only", previousSha, head], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function run() {
  try {
    const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA?.trim() || "";
    const head = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || "HEAD";
    const paths = changedFiles(previousSha, head);

    if (shouldIgnoreDeployment(paths)) {
      console.log("Skipping Vercel build: all changes are documentation/test/CI-only.");
      process.exit(0);
    }

    const runtimePaths = paths.filter((path) => !isDeploymentNeutralPath(path));
    console.log(`Running Vercel build: runtime/build paths changed: ${runtimePaths.join(", ")}`);
    process.exit(1);
  } catch (error) {
    // Exit 0 means skip. Any uncertainty must fail open to a real build.
    console.warn(`Running Vercel build conservatively: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
