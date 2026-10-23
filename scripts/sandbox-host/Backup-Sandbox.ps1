#Requires -Version 7.3
<#
Owner-operated backup/restore for the persistent Docker workspace.
Requires Docker Desktop, age (https://github.com/FiloSottile/age), and an
encrypted NTFS staging drive. Never pass identity secrets through ChatGPT.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateSet('Backup','Verify','Restore-Staging')][string]$Action,
  [Parameter(Mandatory)][string]$BackupDir,
  [string]$Recipient,
  [string]$IdentityFile,
  [string]$Archive,
  [string]$Volume = 'ai-dev-sandbox-workspace',
  [string]$Container = 'ai-docker-sandbox'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$BackupDir = [IO.Path]::GetFullPath($BackupDir)
if (-not (Test-Path -LiteralPath $BackupDir -PathType Container)) {
  throw 'Create an existing, encrypted local backup directory first.'
}
if ($BackupDir.Contains(',')) { throw 'Backup directory cannot contain commas (Docker mount syntax).' }
foreach ($tool in @('docker','age')) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Missing required CLI: $tool" }
}
$Image = 'busybox:1.36.1'
& docker image inspect $Image *> $null
if ($LASTEXITCODE -ne 0) { throw "Pull and review the pinned backup helper image first: docker pull $Image" }
$archiveName = if ($Archive) { [IO.Path]::GetFileName($Archive) } else { '' }
$tempName = ''
$tempFile = ''
$paused = $false
try {
  if ($Action -eq 'Backup') {
    if (-not $Recipient -or $Recipient -notmatch '^age1[a-z0-9]{58}$') { throw 'Provide a valid age public recipient.' }
    & docker volume inspect $Volume *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Workspace volume does not exist.' }
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $tempName = "workspace-$stamp-$([Guid]::NewGuid().ToString('N')).tar.gz"
    $tempFile = Join-Path $BackupDir $tempName
    $sealed = Join-Path $BackupDir "workspace-$stamp.tar.gz.age"
    $partial = "$sealed.partial"
    $running = (& docker inspect --format '{{.State.Running}}' $Container).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Sandbox container not found.' }
    if ($running -eq 'true') {
      & docker pause $Container *> $null
      if ($LASTEXITCODE -ne 0) { throw 'Failed to pause sandbox; backup aborted.' }
      $paused = $true
    }
    try {
      & docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 --memory 1g --cpus 2 `
        --mount "type=volume,source=$Volume,target=/data,readonly" `
        --mount "type=bind,source=$BackupDir,target=/backup" $Image `
        sh -c "cd /data && tar -czf '/backup/$tempName' ."
      if ($LASTEXITCODE -ne 0) { throw 'Volume archive failed.' }
    } finally {
      if ($paused) { & docker unpause $Container *> $null; $paused = $false }
    }
    & age -r $Recipient -o $partial $tempFile
    if ($LASTEXITCODE -ne 0) { throw 'Backup encryption failed.' }
    Move-Item -LiteralPath $partial -Destination $sealed -ErrorAction Stop
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sealed).Hash.ToLowerInvariant()
    Set-Content -LiteralPath "$sealed.sha256" -Value $hash -NoNewline
    Write-Output "Encrypted backup created: $sealed"
    Write-Output 'Run Verify from a separate restore identity before relying on this backup.'
    return
  }
  if (-not $Archive -or -not (Test-Path -LiteralPath $Archive -PathType Leaf)) { throw 'Provide an existing encrypted archive.' }
  if (-not $IdentityFile -or -not (Test-Path -LiteralPath $IdentityFile -PathType Leaf)) { throw 'Provide an age identity file stored separately.' }
  $expectedFile = "$Archive.sha256"
  if (Test-Path -LiteralPath $expectedFile) {
    $expected = (Get-Content -LiteralPath $expectedFile -Raw).Trim()
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $Archive).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { throw 'Encrypted archive SHA-256 mismatch.' }
  }
  $tempName = "sandbox-restore-$([Guid]::NewGuid().ToString('N')).tar.gz"
  $tempFile = Join-Path $BackupDir $tempName
  & age -d -i $IdentityFile -o $tempFile $Archive
  if ($LASTEXITCODE -ne 0) { throw 'Authenticated decryption failed.' }
  $inputMount = "type=bind,source=$BackupDir,target=/backup,readonly"
  if ($Action -eq 'Verify') {
    & docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges `
      --mount $inputMount $Image tar -tzf "/backup/$tempName" *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Archive integrity verification failed.' }
    Write-Output 'Encrypted archive decrypted and tar integrity verified.'
    return
  }
  $staging = "ai-dev-sandbox-restore-$([Guid]::NewGuid().ToString('N'))"
  & docker volume create $staging *> $null
  if ($LASTEXITCODE -ne 0) { throw 'Cannot create staging volume.' }
  & docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges `
    --mount $inputMount --mount "type=volume,source=$staging,target=/data" $Image `
    sh -c "tar -xzf '/backup/$tempName' -C /data && test -f /data/README.md"
  if ($LASTEXITCODE -ne 0) { throw "Restore failed; inspect staging volume: $staging" }
  Write-Output "Verified staging restore: $staging"
  Write-Output 'The live ai-dev-sandbox-workspace volume was NOT modified.'
} finally {
  if ($paused) { & docker unpause $Container *> $null }
  if ($tempFile -and (Test-Path -LiteralPath $tempFile)) {
    Remove-Item -LiteralPath $tempFile -Force
  }
}
