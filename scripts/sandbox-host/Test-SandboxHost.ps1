#Requires -Version 7.3
<# Read-only Windows diagnostics. Does not print credentials or command lines. #>
[CmdletBinding()]
param(
  [string]$Container = 'ai-dev-workspace',
  [string]$Volume = 'ai-dev-sandbox-workspace',
  [string]$SupervisorTaskName = 'CartShiftSandboxWorker',
  [string]$BackupDir,
  [int]$MaxBackupAgeDays = 8
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
$results = [ordered]@{
  at = (Get-Date).ToUniversalTime().ToString('o')
  docker_reachable = $false
  container_running = $false
  worker_process_seen = $false
  workspace_volume_exists = $false
  host_task_found = $false
  host_task_state = 'not_found'
  recent_encrypted_backup = $false
  checks = @()
}
function Mark([string]$check, [bool]$ok, [string]$details) {
  $results.checks += @{ check = $check; ok = $ok; details = $details }
}
try {
  Invoke-HostDocker info --format '{{.ServerVersion}}' *> $null
  if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop unavailable' }
  $results.docker_reachable = $true
  Invoke-HostDocker volume inspect $Volume *> $null
  $results.workspace_volume_exists = ($LASTEXITCODE -eq 0)
  Mark 'persistent_volume' $results.workspace_volume_exists 'Named Docker volume'
  $owned=Get-SandboxSpec $Container
  Assert-SandboxRestrictions $owned
  Assert-SandboxMount $owned '/workspace' $Volume $true
  $containerInfo = Invoke-HostDocker inspect $Container --format '{{json .HostConfig}}'
  if ($LASTEXITCODE -ne 0) { throw 'Sandbox container not found' }
  $hostConfig = $containerInfo | ConvertFrom-Json
  $running = (Invoke-HostDocker inspect $Container --format '{{.State.Running}}').Trim()
  $results.container_running = ($running -eq 'true')
  Mark 'container_running' $results.container_running 'Host availability depends on Windows being awake'
  Mark 'not_privileged' (-not [bool]$hostConfig.Privileged) 'Privileged must remain disabled'
  Mark 'read_only_root' ([bool]$hostConfig.ReadonlyRootfs) 'Read-only root filesystem'
  Mark 'no_host_network' ($hostConfig.NetworkMode -ne 'host') 'No host network namespace'
  Mark 'no_docker_socket' (-not @($hostConfig.Binds | Where-Object { $_ -match 'docker\.sock' }).Count) 'No Docker socket bind'
  if ($results.container_running) {
    $top = (Invoke-HostDocker top $Container) -join "`n"
    $results.worker_process_seen = $top.Contains('--token-stdin')
  }
  Mark 'worker_process_seen' $results.worker_process_seen 'Worker transport process seen; source hashes require supervisor verification'
  $task = Get-ScheduledTask -TaskName $SupervisorTaskName -ErrorAction SilentlyContinue
  if ($task) {
    $results.host_task_found = $true
    $results.host_task_state = [string]$task.State
  }
  Mark 'supervisor_task' $results.host_task_found 'Windows logon restart policy requires owner verification'
  if ($BackupDir) {
    $latest = Get-ChildItem -LiteralPath $BackupDir -Filter '*.tar.gz.age' -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    $results.recent_encrypted_backup = [bool]($latest -and $latest.LastWriteTimeUtc -gt (Get-Date).ToUniversalTime().AddDays(-$MaxBackupAgeDays))
    Mark 'recent_encrypted_backup' $results.recent_encrypted_backup 'This checks age, not restore correctness'
  }
} catch {
  Mark 'inspection_error' $false $_.Exception.Message
}
[pscustomobject]$results | ConvertTo-Json -Depth 8
if (@($results.checks | Where-Object { -not $_.ok }).Count) { exit 1 }
