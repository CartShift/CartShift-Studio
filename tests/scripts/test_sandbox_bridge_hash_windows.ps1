#Requires -Version 7.3
param([Parameter(Mandatory)][string]$SupervisorScript)
$ErrorActionPreference='Stop'
$program=Get-Content -LiteralPath $SupervisorScript -Raw
$block=[regex]::Match($program,'(?ms)^  \$(?:source|bytes)=.+?(?=^  \$process=)').Value
if(!$block){throw 'Production source-verification block absent.'}
$BridgeSource=Join-Path ([IO.Path]::GetTempPath()) ('bridge-pin-'+[Guid]::NewGuid().ToString('N')+'.mjs')
$old='console.log("unreviewed snapshot")'
$good='console.log("reviewed snapshot")'
$BridgeSha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($good))).ToLowerInvariant()
function Get-FileHash([string]$LiteralPath,[string]$Algorithm){
 # Reproduce an update between a separate source read and on-disk hash.
 [IO.File]::WriteAllText($LiteralPath,$good)
 [pscustomobject]@{Hash=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([IO.File]::ReadAllBytes($LiteralPath)))}
}
try{
 [IO.File]::WriteAllText($BridgeSource,$old)
 $refused=$false;$accepted=$null
 try{$accepted=& ([scriptblock]::Create($block+"`nreturn `$source"))}catch{$refused=$true}
 if(!$refused -and $accepted -cne $good){throw 'Injected source differed from the successfully verified source.'}
 [IO.File]::WriteAllText($BridgeSource,$good)
 $accepted=& ([scriptblock]::Create($block+"`nreturn `$source"))
 if($accepted -cne $good){throw 'A matching reviewed source was not accepted.'}
 Write-Output 'PASS: Only the exact successfully hashed source snapshot can be injected.'
}finally{Remove-Item -LiteralPath $BridgeSource}
