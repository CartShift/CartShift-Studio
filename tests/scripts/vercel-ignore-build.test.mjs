import { describe, expect, it } from "vitest";
import { isDeploymentNeutralPath, shouldIgnoreDeployment } from "../../scripts/vercel-ignore-build.mjs";

describe("Vercel ignored-build scope", () => {
  it("skips documentation, tests, and CI-only changes", () => {
    expect(isDeploymentNeutralPath("docs/LIQUID_LOOM_LANDING_PAGE.md")).toBe(true);
    expect(isDeploymentNeutralPath("README.md")).toBe(true);
    expect(isDeploymentNeutralPath("tests/services/analyzer.test.ts")).toBe(true);
    expect(isDeploymentNeutralPath(".github/workflows/ci.yml")).toBe(true);
    expect(shouldIgnoreDeployment(["README.md", "docs/DEPLOYMENT.md"])).toBe(true);
  });

  it("keeps runtime and mixed commits deployable", () => {
    expect(isDeploymentNeutralPath("app/[locale]/page.tsx")).toBe(false);
    expect(isDeploymentNeutralPath("messages/en.json")).toBe(false);
    expect(shouldIgnoreDeployment(["docs/README.md", "app/[locale]/page.tsx"])).toBe(false);
  });

  it("fails open for an empty diff", () => {
    expect(shouldIgnoreDeployment([])).toBe(false);
  });
});
