import 'server-only';

import { z } from 'zod';
import { AUDIT, firestore, type TokenGrant } from '@/lib/mcp/connection';
import { authorizeSandboxOwner } from '@/lib/mcp/sandbox-jobs';

// A deliberately narrow Codespaces control plane. It never executes shell commands,
// accesses the local worker credential, or automatically starts a metered VM.
const githubName = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/;
const codespaceName = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,127}$/);
type GithubCodespace = {
  name: string;
  state: string;
  web_url?: string;
  owner?: { login?: string };
  billable_owner?: { login?: string };
  repository?: { full_name?: string };
  machine?: { cpus?: number; display_name?: string };
  idle_timeout_minutes?: number;
};
type GithubIdentity = { login?: string; type?: string };
type GithubMachines = { machines?: Array<{ name: string; cpus: number }> };

function settings() {
  const token = process.env.GITHUB_CODESPACES_TOKEN || '';
  const repository = process.env.GITHUB_CODESPACES_REPOSITORY || '';
  const [owner, repo, extra] = repository.split('/');
  const valid = !extra && !!owner && !!repo && githubName.test(owner) && githubName.test(repo);
  if (repository && !valid) throw new Error('CODESPACES_INVALID_REPOSITORY');
  return {
    token,
    repository,
    owner,
    repo,
    configured: Boolean(token && token.length >= 20 && valid),
    lifecycleEnabled: process.env.GITHUB_CODESPACES_LIFECYCLE_ENABLED === 'true',
  };
}

async function api<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: object): Promise<T> {
  const { token, configured } = settings();
  if (!configured) throw new Error('CODESPACES_NOT_CONFIGURED');
  // Paths are constructed exclusively from validated names, never caller-supplied URLs.
  const response = await fetch('https://api.github.com' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('CODESPACES_AUTH_OR_PERMISSION_DENIED');
    if (response.status === 402) throw new Error('CODESPACES_GITHUB_BILLING_BLOCKED');
    if (response.status === 404) throw new Error('CODESPACES_NOT_FOUND');
    if (response.status === 409) throw new Error('CODESPACES_CONFLICT');
    throw new Error('CODESPACES_GITHUB_API_FAILED_' + response.status);
  }
  return response.json() as Promise<T>;
}

function checkOwned(item: GithubCodespace, owner: string, repository: string): void {
  if (item.owner?.login?.toLowerCase() !== owner.toLowerCase() ||
      item.billable_owner?.login?.toLowerCase() !== owner.toLowerCase() ||
      item.repository?.full_name?.toLowerCase() !== repository.toLowerCase()) {
    throw new Error('CODESPACES_UNAPPROVED_OWNER_OR_BILLING');
  }
}

async function identity() {
  const config = settings();
  const user = await api<GithubIdentity>('/user');
  if (user.type !== 'User' || user.login?.toLowerCase() !== config.owner?.toLowerCase()) {
    throw new Error('CODESPACES_TOKEN_OWNER_MISMATCH');
  }
  return config;
}

async function listOwned() {
  const config = await identity();
  const response = await api<{ codespaces?: GithubCodespace[]; total_count?: number }>(
    '/user/codespaces?per_page=100');
  // Never silently assume pagination is complete when deciding whether to create
  // another billable Codespace.
  if ((response.total_count ?? 0) > 100) throw new Error('CODESPACES_LIST_PAGINATION_REQUIRED');
  const matches = (response.codespaces ?? []).filter(item =>
    item.repository?.full_name?.toLowerCase() === config.repository.toLowerCase());
  for (const item of matches) checkOwned(item, config.owner!, config.repository);
  return matches;
}

function summary(item: GithubCodespace) {
  return {
    name: item.name, state: item.state, repository: item.repository?.full_name,
    machine_cpus: item.machine?.cpus ?? null, idle_timeout_minutes: item.idle_timeout_minutes ?? null,
    web_url: item.web_url ?? null, billable_owner: item.billable_owner?.login ?? null,
  };
}

async function getOwned(name: string): Promise<GithubCodespace> {
  const config = await identity();
  const item = await api<GithubCodespace>('/user/codespaces/' + encodeURIComponent(name));
  checkOwned(item, config.owner!, config.repository);
  return item;
}

async function audit(grant: TokenGrant, action: string, target: string) {
  // Audit intent before any billable provider operation.
  await firestore().collection(AUDIT).add({
    uid: grant.uid, action, targetId: target, at: Date.now(), provider: 'github_codespaces',
  });
}

export const CODESPACES_TOOL_DEFS = [
  {
    name: 'sandbox_codespaces_status',
    description: 'Read owner-only GitHub Codespaces integration configuration; does not start or bill cloud compute.',
    scope: 'work:read',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sandbox_codespaces_list',
    description: 'List personal GitHub Codespaces for the explicitly configured repository and billable owner; no VM starts.',
    scope: 'work:read',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sandbox_codespaces_create',
    description: 'Explicitly create one 2-core personal GitHub Codespace in the allowed repository. Starts metered compute; require owner authorization and configured lifecycle opt-in. Never call automatically.',
    scope: 'work:write',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sandbox_codespaces_start',
    description: 'Explicitly start an existing personal GitHub Codespace. Starts metered compute; never call automatically.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['name'],
      properties: { name: { type: 'string' } }, additionalProperties: false },
  },
  {
    name: 'sandbox_codespaces_stop',
    description: 'Stop an existing authorized personal GitHub Codespace to end compute billing; saved data remains.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['name'],
      properties: { name: { type: 'string' } }, additionalProperties: false },
  },
] as const;

export async function callCodespacesTool(name: string, input: unknown, grant: TokenGrant): Promise<unknown> {
  authorizeSandboxOwner(grant);
  const args = z.object({
    name: codespaceName.optional(),
  }).strict().parse(input);
  if (name === 'sandbox_codespaces_status') {
    z.object({}).strict().parse(input);
    const config = settings();
    return { configured: config.configured, repository: config.repository || null,
      lifecycle_enabled: config.lifecycleEnabled,
      execution_bridge_connected: false, // lifecycle API is NOT a shell transport
      requires: config.configured ? [] : ['GITHUB_CODESPACES_TOKEN', 'GITHUB_CODESPACES_REPOSITORY'] };
  }
  if (name === 'sandbox_codespaces_list') {
    z.object({}).strict().parse(input);
    return { codespaces: (await listOwned()).map(summary), execution_bridge_connected: false };
  }
  const config = settings();
  if (!config.lifecycleEnabled) throw new Error('CODESPACES_LIFECYCLE_DISABLED');
  if (name === 'sandbox_codespaces_create') {
    z.object({}).strict().parse(input);
    if ((await listOwned()).length) throw new Error('CODESPACES_ALREADY_EXISTS');
    const machines = await api<GithubMachines>('/repos/' + config.owner + '/' + config.repo + '/codespaces/machines');
    const machine = machines.machines?.find(item => item.cpus === 2);
    if (!machine) throw new Error('CODESPACES_NO_TWO_CORE_MACHINE');
    await audit(grant, 'sandbox_codespaces_create', config.repository);
    const created = await api<GithubCodespace>('/repos/' + config.owner + '/' + config.repo + '/codespaces',
      'POST', { machine: machine.name, geo: 'EuropeWest', idle_timeout_minutes: 15,
        multi_repo_permissions_opt_out: true });
    checkOwned(created, config.owner!, config.repository);
    return { codespace: summary(created), execution_bridge_connected: false };
  }
  if (name === 'sandbox_codespaces_start' || name === 'sandbox_codespaces_stop') {
    if (!args.name) throw new Error('CODESPACES_NAME_REQUIRED');
    const existing = await getOwned(args.name);
    if (name === 'sandbox_codespaces_start' && existing.machine?.cpus !== 2) {
      throw new Error('CODESPACES_TWO_CORE_ONLY');
    }
    if (name === 'sandbox_codespaces_start' && existing.state === 'Available') {
      return { codespace: summary(existing), already_running: true };
    }
    if (name === 'sandbox_codespaces_stop' && ['Shutdown', 'Stopped'].includes(existing.state)) {
      return { codespace: summary(existing), already_stopped: true };
    }
    await audit(grant, name, existing.name);
    const next = await api<GithubCodespace>('/user/codespaces/' +
      encodeURIComponent(existing.name) + (name === 'sandbox_codespaces_start' ? '/start' : '/stop'), 'POST');
    checkOwned(next, config.owner!, config.repository);
    return { codespace: summary(next) };
  }
  throw new Error('Unknown Codespaces tool');
}
