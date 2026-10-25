#Requires -Version 7.3
param([string[]]$Paths)
$ErrorActionPreference='Stop'
$owner=$windowsOwner=[Security.Principal.WindowsIdentity]::GetCurrent().Name
foreach($path in $Paths){
 $tokens=$null;$errors=$null
 $ast=[Management.Automation.Language.Parser]::ParseFile($path,[ref]$tokens,[ref]$errors)
 if($errors){throw 'Supervisor registration parse failed.'}
 $assignment=$ast.Find({param($node) $node -is [Management.Automation.Language.AssignmentStatementAst] -and $node.Left.Extent.Text -eq '$trigger'},$true)
 if(!$assignment){throw 'Supervisor trigger assignment absent.'}
 $triggers=@(& ([scriptblock]::Create($assignment.Right.Extent.Text)))
 if($triggers.Count -ne 2){throw 'Supervisor requires logon and independent periodic recovery triggers.'}
 if(@($triggers|Where-Object {$_.CimClass.CimClassName -eq 'MSFT_TaskLogonTrigger'}).Count -ne 1){throw 'Owner logon trigger lost.'}
 $periodic=@($triggers|Where-Object {$_.CimClass.CimClassName -eq 'MSFT_TaskTimeTrigger'})
 if($periodic.Count -ne 1 -or $periodic[0].Repetition.Interval -ne 'PT1M'){throw 'Periodic recovery interval must be one minute.'}
}
Write-Output 'PASS: Actual registration expressions create owner-logon and one-minute recovery triggers.'

