#Requires -Version 7.3
# Fixed local stdio transport for the isolated V4 build runtime. No arbitrary commands.
[CmdletBinding()]
param(
 [Parameter(Mandatory)][ValidatePattern('^sha256:[a-f0-9]{64}$')][string]$ImageId,
 [ValidateSet('ai-dev-workspace','ai-dev-workspace-v4-candidate')][string]$Container='ai-dev-workspace'
)
$ErrorActionPreference='Stop'
try{
 . "$PSScriptRoot/Common-SandboxHost.ps1"
 $s=Get-SandboxSpec $Container
 Assert-SandboxRestrictions $s
 if(!$s.running -or $s.image -ne $ImageId -or $s.hostname -ne 'ai-docker-sandbox' -or $s.labels.'io.cartshift.sandbox.build' -ne 'credential-isolated-v1'){throw 'Verified V4 build runtime unavailable.'}
 Assert-SandboxMount $s '/workspace' 'ai-dev-sandbox-workspace' $true
 Assert-SandboxMount $s '/workspace/.auth' 'ai-dev-sandbox-empty-auth' $false
 Assert-SandboxMount $s '/home/node' 'ai-dev-sandbox-build-home' $true
 Assert-SandboxMount $s '/home/node/.desktop-commander-device' 'ai-dev-sandbox-build-device-auth' $true
 if(@($s.mounts|Where-Object Type -eq volume).Count -ne 4 -or ($s.host.PortBindings -and @($s.host.PortBindings.PSObject.Properties).Count)){throw 'Unexpected build mounts or published ports.'}
 Invoke-SandboxDocker @('exec','--user','1000:1000',$Container,'python3','-I','-c','import pathlib,os; p=pathlib.Path("/workspace/.auth"); assert any(len(f:=line.split())>5 and f[4]==str(p) for line in pathlib.Path("/proc/self/mountinfo").read_text().splitlines()) and os.statvfs(p).f_flag & os.ST_RDONLY and not any(p.iterdir())')|Out-Null
}catch{[Console]::Error.WriteLine('Local V4 MCP refused the runtime boundary.');exit 1}
# Native invocation keeps JSON-RPC stdin/stdout byte streams untouched.
& $script:SandboxDockerExe --host $script:SandboxDockerEndpoint exec -i --user 1000:1000 --workdir /workspace --env DC_REMOTE_DEVICE=true $Container node /opt/dc/node_modules/@wonderwhy-er/desktop-commander/dist/index.js --no-onboarding
exit $LASTEXITCODE
