# Export immutable image from verified Windows worker without exporting secrets.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [string]$ContainerName = 'ai-dev-pool-1'
)
$ErrorActionPreference = 'Stop'
if ($ContainerName -notmatch '^ai-dev-pool-[1-8]$') {
    throw 'Refusing non-pool source container.'
}
$raw = & docker container inspect $ContainerName 2>&1
if ($LASTEXITCODE -ne 0) { throw "Cannot inspect $ContainerName." }
$container = @($raw | Out-String | ConvertFrom-Json)[0]
if (-not $container -or -not $container.Image -or $container.Config.Hostname -ne 'ai-docker-sandbox') {
    throw 'Source hostname or image identity does not match expected sandbox.'
}
$imageId = [string]$container.Image
if ($imageId -notmatch '^sha256:[0-9a-f]{64}$') { throw 'Unexpected image ID.' }
$arch = (& docker image inspect --format '{{.Architecture}}' $imageId 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $arch -ne 'arm64') { throw "Expected ARM64; received $arch" }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archive = Join-Path $OutputDirectory "sandbox-arm64-$stamp.tar"
if (Test-Path -LiteralPath $archive) { throw 'Refusing overwrite.' }
& docker image save --output $archive $imageId
if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $archive -ErrorAction SilentlyContinue
    throw 'Docker image export failed.'
}
$checksum = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
$manifest = [ordered]@{
    schema = 1
    created_at = (Get-Date).ToUniversalTime().ToString('o')
    source_container = $ContainerName
    image_id = $imageId
    architecture = 'arm64'
    filename = [System.IO.Path]::GetFileName($archive)
    sha256 = $checksum
    bytes = (Get-Item -LiteralPath $archive).Length
    includes_workspace = $false
    includes_credentials = $false
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath "$archive.manifest.json" -Encoding utf8
Write-Host "Archive: $archive"
Write-Host "SHA256: $checksum"
Write-Host "Image ID: $imageId"
Write-Warning 'Image only. Restore independently verified encrypted volumes/owner config separately. Never share credentials in chat.'
