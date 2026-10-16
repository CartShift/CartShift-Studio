import { describe, expect, it } from "vitest";
import { isDeploymentNeutralPath, shouldIgnoreDeployment } from "../../scripts/vercel-ignore-build.mjs";

describe("Vercel ignored-build scope", () => {
  it("skips repository documentation, tests, and CI-only changes", () => {
    expect(isDeploymentNeutralPath("docs/LIQUID_LOOM_LANDING_PAGE.md")).toBe(true);
    expect(isDeploymentNeutralPath("README.md")).toBe(true);
    expect(isDeploymentNeutralPath("DESIGN.md")).toBe(true);
    expect(isDeploymentNeutralPath("tests/services/analyzer.test.ts")).toBe(true);
    expect(isDeploymentNeutralPath(".github/workflows/ci.yml")).toBe(true);
    expect(isDeploymentNeutralPath("scripts/ci/plan-checks.mjs")).toBe(true);
    expect(shouldIgnoreDeployment(["README.md", "docs/DEPLOYMENT.md"])).toBe(true);
  });

  it("keeps runtime content and mixed commits deployable", () => {
    expect(isDeploymentNeutralPath("app/[locale]/page.tsx")).toBe(false);
    expect(isDeploymentNeutralPath("messages/en.json")).toBe(false);
    expect(isDeploymentNeutralPath("content/case-studies/example.md")).toBe(false);
    expect(shouldIgnoreDeployment(["docs/README.md", "app/[locale]/page.tsx"])).toBe(false);
  });

  it("skips Firebase-only code and infrastructure changes", () => {
    const firebaseOnly = [
      "functions/index.js",
      "functions/pnpm-lock.yaml",
      "firestore.rules",
      "storage.rules",
      "firestore.indexes.json",
      "firebase.json",
      ".firebaserc",
      ".firebaseignore",
      "apphosting.yaml",
    ];
    for (const path of firebaseOnly) {
      expect(isDeploymentNeutralPath(path)).toBe(true);
    }
    expect(shouldIgnoreDeployment(["functions/index.js", "firestore.indexes.json"])).toBe(true);
  });

  it("builds for mixed Firebase and app changes, or shared dependency changes", () => {
    expect(shouldIgnoreDeployment(["functions/index.js", "app/page.tsx"])).toBe(false);
    expect(shouldIgnoreDeployment(["functions/index.js", "pnpm-lock.yaml"])).toBe(false);
    expect(shouldIgnoreDeployment(["functions/index.js", "pnpm-workspace.yaml"])).toBe(false);
    expect(isDeploymentNeutralPath("scripts/vercel-ignore-build.mjs")).toBe(false);
    expect(isDeploymentNeutralPath("scripts/validate-translations.js")).toBe(false);
  });

  it("fails open for an empty diff", () => {
    expect(shouldIgnoreDeployment([])).toBe(false);
  });
});
