# Read-only, redacted host inventory for Android Podroid portability.
# No secrets, host paths, environment variables, docker logs or volume contents.
[CmdletBinding()]
param(
    [string]$OutputDirectory = (Join-Path $env:USERPROFILE 'Documents\SandboxMobileInventory')
)
$ErrorActionPreference = 'Stop'
$names = @('ai-dev-pool-1','ai-dev-pool-2','ai-auth-sandbox','ai-dev-workspace')
function DockerJson([string]$Name) {
    $raw = & docker container inspect $Name 2>&1
    if ($LASTEXITCODE -ne 0) { return $null }
    return @($raw | Out-String | ConvertFrom-Json)[0]
}
$dockerVersion = (& docker version --format '{{.Server.Version}}' 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Docker daemon unavailable. No inventory created.' }
$containers = @()
$volumeNames = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($name in $names) {
    $c = DockerJson $name
    if (-not $c) {
        $containers += [ordered]@{ name=$name; present=$false }
        continue
    }
    $mounts = @()
    foreach ($m in @($c.Mounts)) {
        if ($m.Type -eq 'volume') { [void]$volumeNames.Add([string]$m.Name) }
        $mounts += [ordered]@{
            type = [string]$m.Type
            volume = if ($m.Type -eq 'volume') { [string]$m.Name } else { $null }
            destination = [string]$m.Destination
            read_only = (-not [bool]$m.RW)
        }
    }
    $mem = if ($null -ne $c.HostConfig.Memory) { [long]$c.HostConfig.Memory } else { 0 }
    $containers += [ordered]@{
        name = $name
        present = $true
        running = ([string]$c.State.Status -eq 'running')
        hostname = [string]$c.Config.Hostname
        image_id = [string]$c.Image
        user = [string]$c.Config.User
        privileged = [bool]$c.HostConfig.Privileged
        readonly_rootfs = [bool]$c.HostConfig.ReadonlyRootfs
        network_mode = [string]$c.HostConfig.NetworkMode
        memory_limit_bytes = $mem
        pid_limit = $c.HostConfig.PidsLimit
        published_port_count = @($c.NetworkSettings.Ports.PSObject.Properties | Where-Object {
            $null -ne $_.Value -and @($_.Value).Count -gt 0
        }).Count
        mounts = @($mounts)
    }
}
$allVolumes = @()
foreach ($name in ($volumeNames | Sort-Object)) {
    $raw = & docker volume inspect $name 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Volume inventory failed for $name" }
    $v = @($raw | Out-String | ConvertFrom-Json)[0]
    $allVolumes += [ordered]@{ name = [string]$v.Name; driver = [string]$v.Driver; scope = [string]$v.Scope }
}
$report = [ordered]@{
    schema = 1
    created_at = (Get-Date).ToUniversalTime().ToString('o')
    docker_server_version = $dockerVersion
    host_architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
    selected_container_count = @($containers | Where-Object present).Count
    volumes = $allVolumes
    containers = $containers
    excludes = @('Docker environment variables','Docker command','Docker logs','Host mount source paths',
                 'Host user identity','Tokens','Backup recovery keys','Volume contents')
}
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$out = Join-Path $OutputDirectory 'sandbox-mobile-inventory.json'
if (Test-Path -LiteralPath $out) { throw "Refusing to overwrite inventory: $out" }
$report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $out -Encoding utf8
Write-Host "Read-only inventory created: $out"
Write-Host "Docker server: $dockerVersion; selected containers present: $($report.selected_container_count); volumes referenced: $($allVolumes.Count)"
Write-Host 'Review the manifest locally. This does NOT prove backup freshness, off-host sync, or worker protocol compatibility.'
