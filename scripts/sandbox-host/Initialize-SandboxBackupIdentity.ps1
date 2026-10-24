#Requires -Version 7.3
[CmdletBinding()]
param([Parameter(Mandatory)][string]$PrivateDir,[Parameter(Mandatory)][string]$AgeKeygenExecutable)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$PrivateDir=[IO.Path]::GetFullPath($PrivateDir)
if(!(Test-Path -LiteralPath $PrivateDir -PathType Container)){throw 'Create a private owner-only NTFS directory first.'}
$identity=Join-Path $PrivateDir 'backup-identity.dpapi'
$public=Join-Path $PrivateDir 'backup-recipient.txt'
if((Test-Path -LiteralPath $identity) -or (Test-Path -LiteralPath $public)){throw 'Identity exists; refusing replacement.'}
function Keygen([string[]]$argv,[string]$inputText=''){
 $si=[Diagnostics.ProcessStartInfo]::new((Get-Command $AgeKeygenExecutable -ErrorAction Stop).Source)
 $si.UseShellExecute=$false;$si.CreateNoWindow=$true;$si.RedirectStandardInput=$true;$si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
 foreach($arg in $argv){[void]$si.ArgumentList.Add($arg)}
 $p=[Diagnostics.Process]::new();$p.StartInfo=$si
 try{[void]$p.Start();$out=$p.StandardOutput.ReadToEndAsync();$err=$p.StandardError.ReadToEndAsync();if($inputText){$p.StandardInput.WriteLine($inputText)};$p.StandardInput.Close();$p.WaitForExit();$data=$out.GetAwaiter().GetResult();[void]$err.GetAwaiter().GetResult();if($p.ExitCode -ne 0){throw 'Age identity generation failed.'};return $data}finally{$p.Dispose()}
}
$key=Keygen @()
try{
 if($key -notmatch 'AGE-SECRET-KEY-1[A-Z0-9]+'){throw 'Unexpected identity format.'}
 $recipient=(Keygen @('-y') $key).Trim()
 if($recipient -cnotmatch '^age1[a-z0-9]{58}$'){throw 'Unexpected public recipient.'}
 $secret=ConvertTo-SecureString $key -AsPlainText -Force
 try{[IO.File]::WriteAllText($identity,(ConvertFrom-SecureString $secret))}finally{$secret.Dispose()}
 [IO.File]::WriteAllText($public,$recipient)
 Write-Output 'Age identity generated and stored with CurrentUser DPAPI; public recipient saved separately.'
 Write-Output 'An independently recoverable offline key export is still required before migration.'
}finally{$key=$null}
