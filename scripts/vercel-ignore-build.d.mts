export type DeploymentDecision = {
  skip: boolean;
  reason: string;
};

export function deploymentDecision(
  files: string[] | null | undefined,
): DeploymentDecision;

export function shouldIgnoreBuild(options?: {
  files?: string[] | null;
  ref?: string;
}): boolean;
