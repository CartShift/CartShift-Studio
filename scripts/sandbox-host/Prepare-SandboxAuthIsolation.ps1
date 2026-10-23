#Requires -Version 7.3
[CmdletBinding(SupportsShouldProcess,ConfirmImpact='High')]
param(
 [Parameter(Mandatory)][ValidateSet('Prepare','CreateSidecar','Verify','Finalize')][string]$Action,
 [string]$WorkspaceVolume='ai-dev-sandbox-workspace',
 [string]$AuthVolume='ai-dev-sandbox-provider-auth',
 [string]$ToolsVolume='ai-dev-sandbox-auth-tools',
 [string]$BuildContainer='ai-dev-workspace',
 [string]$AuthContainer='ai-auth-sandbox',
 [ValidatePattern('^[a-fA-F0-9]{64}$')][string]$ToolsManifestSha256,
 [switch]$RestoreVerified,[switch]$AuthWorkerVerified,[switch]$AuthTokenEnforced
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'Common-SandboxHost.ps1')
if ($Action -eq 'Finalize') { throw 'Credential deletion is disabled. Preserve every original volume and credential for rollback.' }
$base=Get-SandboxSpec $BuildContainer
Assert-SandboxRestrictions $base
Assert-SandboxMount $base '/workspace' $WorkspaceVolume $true
$image=$base.image
Assert-SandboxImage $image
Assert-SandboxVolumeOwner $WorkspaceVolume
$snapshot=@'
import hashlib,json,os,pathlib,shutil
src=pathlib.Path('/workspace'); dst=pathlib.Path('/out')
allowed=[src/'scripts',src/'toolchain']
def inside(p,roots): return any(p==r or r in p.parents for r in roots)
for folder,roots in [('.auth',[src/'.auth']),('scripts',allowed),('toolchain',allowed)]:
 base=src/folder
 if not base.is_dir() or base.is_symlink(): raise RuntimeError('Invalid source directory')
 for parent,dirs,files in os.walk(base,followlinks=False):
  for name in dirs+files:
   p=pathlib.Path(parent)/name
   if p.is_symlink() and not inside(p.resolve(strict=True),roots): raise RuntimeError('Snapshot link escapes approved roots')
dev=src/'scripts/devctl'
if not dev.is_file() or dev.is_symlink(): raise RuntimeError('devctl must be a reviewed regular file')
shutil.copytree(src/'.auth',pathlib.Path('/auth'),dirs_exist_ok=True,symlinks=True)
for name in ('scripts','toolchain'): shutil.copytree(src/name,dst/name,dirs_exist_ok=True,symlinks=True)
entries={}
for name in ('scripts','toolchain'):
 for parent,dirs,files in os.walk(dst/name,followlinks=False):
  for f in sorted(dirs+files):
   p=pathlib.Path(parent)/f; key=str(p.relative_to(dst))
   if p.is_symlink(): entries[key]={'link':os.readlink(p)}
   elif p.is_file(): entries[key]={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':p.stat().st_mode&511}
manifest=json.dumps(entries,sort_keys=True,separators=(',',':')).encode()
(dst/'scripts/.sandbox-tools-manifest.json').write_bytes(manifest)
print('CLI manifest SHA256: '+hashlib.sha256(manifest).hexdigest())
'@
$validate=@'
import hashlib,json,os,pathlib,sys
root=pathlib.Path('/workspace')
raw=(root/'scripts/.sandbox-tools-manifest.json').read_bytes()
if hashlib.sha256(raw).hexdigest()!=sys.argv[1].lower(): raise RuntimeError('Unreviewed snapshot manifest')
entries=json.loads(raw); actual=set()
for name in ('scripts','toolchain'):
 for parent,dirs,files in os.walk(root/name,followlinks=False):
  for f in dirs+files:
   p=pathlib.Path(parent)/f; key=str(p.relative_to(root))
   if key=='scripts/.sandbox-tools-manifest.json': continue
   if p.is_symlink():
    actual.add(key); target=p.resolve(strict=True)
    if not any(target==root/n or root/n in target.parents for n in ('scripts','toolchain')): raise RuntimeError('Escaping snapshot link')
    if entries.get(key)!={'link':os.readlink(p)}: raise RuntimeError('Changed snapshot link')
   elif p.is_file():
    actual.add(key)
    if entries.get(key)!={'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'mode':p.stat().st_mode&511}: raise RuntimeError('Changed snapshot file')
if actual!=set(entries): raise RuntimeError('Incomplete snapshot')
'@
switch ($Action) {
 'Prepare' {
  if ($PSCmdlet.ShouldProcess("$AuthVolume + $ToolsVolume",'Snapshot quiesced credentials and CLI closure')) {
   if (-not $RestoreVerified) { throw 'Verify an independently recoverable off-host backup and staging restore, then pass -RestoreVerified.' }
   Assert-SandboxVolumeQuiescent $WorkspaceVolume
   New-SandboxVolume $AuthVolume; New-SandboxVolume $ToolsVolume
   # Only CHOWN on new empty destination roots; no access to source credentials.
   Invoke-SandboxDocker run --rm --network none --read-only --user 0:0 --cap-drop ALL --cap-add CHOWN --security-opt no-new-privileges --entrypoint /bin/sh --mount "type=volume,source=$AuthVolume,target=/auth" --mount "type=volume,source=$ToolsVolume,target=/out" $image -ec 'chown 1000:1000 /auth /out' | Out-Null
   Invoke-SandboxDocker run --rm --network none --read-only --user 1000:1000 --cap-drop ALL --security-opt no-new-privileges --entrypoint python3 --mount "type=volume,source=$WorkspaceVolume,target=/workspace,readonly" --mount "type=volume,source=$AuthVolume,target=/auth" --mount "type=volume,source=$ToolsVolume,target=/out" $image -I -c $snapshot
   Write-Output 'Snapshot preserved originals. Review CLI manifest and retain its SHA256 for CreateSidecar.'
  }
 }
 'CreateSidecar' {
  if (-not $ToolsManifestSha256) { throw 'Supply the independently reviewed CLI manifest SHA256.' }
  Assert-SandboxVolumeOwner $AuthVolume
  Assert-SandboxVolumeOwner $ToolsVolume
  Invoke-HostDocker container inspect $AuthContainer *> $null
  if ($LASTEXITCODE -eq 0) { throw 'Sidecar already exists; never replace an existing container.' }
  if ($PSCmdlet.ShouldProcess($AuthContainer,'Create sidecar from verified immutable CLI snapshot')) {
   $mounts=@('--mount',"type=volume,source=$ToolsVolume,target=/workspace/scripts,volume-subpath=scripts,readonly",'--mount',"type=volume,source=$ToolsVolume,target=/workspace/toolchain,volume-subpath=toolchain,readonly")
   Invoke-SandboxDocker run --rm --network none --read-only --user 1000:1000 --cap-drop ALL --security-opt no-new-privileges --entrypoint python3 @mounts $image -I -c $validate $ToolsManifestSha256 | Out-Null
   Invoke-SandboxDocker run --detach --name $AuthContainer --hostname ai-auth-sandbox --network $base.host.NetworkMode --user 1000:1000 --read-only --restart unless-stopped --cap-drop ALL --security-opt no-new-privileges --pids-limit 120 --memory 1g --cpus 1 --tmpfs '/tmp:rw,nosuid,nodev,size=128m,mode=1777' --log-opt max-size=5m --log-opt max-file=3 --add-host host.docker.internal:127.0.0.1 --add-host gateway.docker.internal:127.0.0.1 --mount "type=volume,source=$AuthVolume,target=/workspace/.auth" @mounts --label sandbox.owner=ai-dev-sandbox --label io.cartshift.sandbox.auth=isolated-v1 --label "io.cartshift.sandbox.tools-manifest=$ToolsManifestSha256" --entrypoint /usr/bin/tini $image -- /bin/sh -c 'sleep infinity' | Out-Null
  }
 }
 'Verify' {
  if (-not $ToolsManifestSha256) { throw 'Supply the reviewed CLI manifest SHA256.' }
  Assert-SandboxVolumeOwner $AuthVolume
  Assert-SandboxVolumeOwner $ToolsVolume
  $spec=Get-SandboxSpec $AuthContainer
  Assert-SandboxRestrictions $spec
  if ($spec.hostname -ne 'ai-auth-sandbox' -or $spec.host.NetworkMode -ne $base.host.NetworkMode -or $spec.image -ne $image -or $spec.labels.'io.cartshift.sandbox.auth' -ne 'isolated-v1' -or $spec.labels.'io.cartshift.sandbox.tools-manifest' -ne $ToolsManifestSha256) { throw 'Sidecar source identity mismatch.' }
  Assert-SandboxMount $spec '/workspace/.auth' $AuthVolume $true
  Assert-SandboxMount $spec '/workspace/scripts' $ToolsVolume $false
  Assert-SandboxMount $spec '/workspace/toolchain' $ToolsVolume $false
  if (@($spec.mounts | Where-Object { $_.Type -eq 'volume' }).Count -ne 3) { throw 'Unexpected sidecar volume.' }
  Invoke-SandboxDocker exec $AuthContainer python3 -I -c $validate $ToolsManifestSha256 | Out-Null
  Invoke-SandboxDocker exec $AuthContainer sh -ec 'test "$(id -u)" = 1000; test ! -e /workspace/projects; test -d /workspace/.auth' | Out-Null
  Write-Output 'Sidecar source manifest, exact mounts, privilege boundary and UID verified.'
 }
}
