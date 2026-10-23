#Requires -Version 7.3
<#
Create an isolated candidate build container while preserving the legacy
container for rollback. Does not change the live container automatically.
Host activation requires stopping the old supervisor and explicit approval.
#>
[CmdletBinding(SupportsShouldProcess,ConfirmImpact='High')]
param(
  [Parameter(Mandatory)][ValidateSet('Prepare','Verify','Activate')][string]$Action,
  [string]$LegacyName='ai-docker-sandbox',
  [string]$CandidateName='ai-docker-sandbox-v4-candidate',
  [string]$WorkspaceVolume='ai-dev-sandbox-workspace',
  [string]$ShadowVolume='ai-dev-sandbox-empty-auth',
  [switch]$AuthWorkerVerified,
  [switch]$AuthTokenEnforced,
  [switch]$OffHostBackupVerified
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
function Docker([string[]]$argv) {
  $value=@(& docker @argv 2>&1)
  if ($LASTEXITCODE -ne 0) { throw "Docker failed with exit $LASTEXITCODE" }
  return $value
}
function ConfirmCandidate() {
  $label=((Docker @('inspect','--format','{{index .Config.Labels "io.cartshift.sandbox.build"}}',$CandidateName)) -join '').Trim()
  if ($label -ne 'credential-isolated-v1') { throw 'Unrecognized candidate label.' }
  $mounts=((Docker @('inspect','--format','{{json .Mounts}}',$CandidateName)) -join '') | ConvertFrom-Json
  $workspace=@($mounts | Where-Object { $_.Destination -eq '/workspace' -and $_.Type -eq 'volume' })
  $shadow=@($mounts | Where-Object { $_.Destination -eq '/workspace/.auth' -and $_.Type -eq 'volume' -and -not $_.RW })
  if ($workspace.Count -ne 1 -or $shadow.Count -ne 1) { throw 'Workspace and credential shadow mounts do not match.' }
  $result=(Docker @('exec',$CandidateName,'sh','-ec',
    'test "$(id -u)" = 1000 && test -d /workspace && test -d /workspace/.auth && test ! -w /workspace/.auth && test ! -e /var/run/docker.sock')) -join ''
  Write-Output "Credential shadow verified for $CandidateName."
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker CLI required.' }
switch ($Action) {
  'Prepare' {
    & docker container inspect $CandidateName *> $null
    if ($LASTEXITCODE -eq 0) { throw 'Candidate already exists, refusing to replace.' }
    $image=((Docker @('inspect','--format','{{.Image}}',$LegacyName)) -join '').Trim()
    if ($image -notmatch '^sha256:[0-9a-f]{64}$') { throw 'Cannot pin legacy image.' }
    if ($PSCmdlet.ShouldProcess($CandidateName,'Create read-only-root candidate without the legacy auth mount')) {
      & docker volume inspect $ShadowVolume *> $null
      if ($LASTEXITCODE -ne 0) { Docker @('volume','create',$ShadowVolume) | Out-Null }
      $runArgs=@('run','--detach','--name',$CandidateName,'--hostname','ai-docker-sandbox',
        '--user','1000:1000','--read-only','--restart','unless-stopped',
        '--cap-drop','ALL','--security-opt','no-new-privileges',
        '--pids-limit','512','--memory','8g','--cpus','4',
        '--tmpfs','/tmp:rw,nosuid,nodev,size=256m',
        '--mount',"type=volume,source=$WorkspaceVolume,target=/workspace",
        '--mount',"type=volume,source=$ShadowVolume,target=/workspace/.auth,readonly",
        '--label','io.cartshift.sandbox.build=credential-isolated-v1',
        $image)
      Docker $runArgs | Out-Null
      Write-Output 'Isolated build candidate created; old container untouched.'
      Write-Output 'Run Verify before changing the owner-held supervisor target.'
    }
  }
  'Verify' { ConfirmCandidate }
  'Activate' {
    if (-not ($AuthWorkerVerified -and $AuthTokenEnforced -and $OffHostBackupVerified)) {
      throw 'Must verify isolated auth login, enforce separate token and restore an off-host backup.'
    }
    ConfirmCandidate
    $oldRunning=((Docker @('inspect','--format','{{.State.Running}}',$LegacyName)) -join '').Trim()
    if ($oldRunning -ne 'false') {
      throw 'Stop the legacy supervisor and container before activation; no automatic kill.'
    }
    $running=((Docker @('inspect','--format','{{.State.Running}}',$CandidateName)) -join '').Trim()
    if ($running -ne 'true') { throw 'Candidate is not running.' }
    if ($PSCmdlet.ShouldProcess("$LegacyName -> $CandidateName",
       'Rename containers to activate isolated candidate (legacy retained for rollback)')) {
      Docker @('rename',$LegacyName,"$LegacyName-retained") | Out-Null
      try {
        Docker @('rename',$CandidateName,$LegacyName) | Out-Null
      } catch {
        Docker @('rename',"$LegacyName-retained",$LegacyName) | Out-Null
        throw
      }
      Write-Output 'Candidate activated under original container name; legacy container retained and stopped.'
      Write-Output 'Restart the reviewed worker supervisor with SANDBOX_WORKER_ROLE=build.'
    }
  }
}
