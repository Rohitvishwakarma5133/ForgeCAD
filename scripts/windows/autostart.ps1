param(
  [ValidateSet('install','uninstall')]
  [string]$Action = 'install'
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'
$tasks = @(
  @{ Name = 'CADly-Backend-Dev'; Dir = $backendDir; Script = 'npm run dev'; Log = (Join-Path $root 'logs\backend.task.log') },
  @{ Name = 'CADly-Frontend-Dev'; Dir = $frontendDir; Script = 'npm run dev'; Log = (Join-Path $root 'logs\frontend.task.log') }
)

if ($Action -eq 'install') {
  New-Item -ItemType Directory -Path (Join-Path $root 'logs') -Force | Out-Null
  foreach ($t in $tasks) {
    $cmd = "cmd.exe /c cd /d `"$($t.Dir)`" && $($t.Script) >> `"$($t.Log)`" 2>>&1"
    schtasks /Create /TN $t.Name /TR $cmd /SC ONLOGON /RL HIGHEST /F | Out-Null
  }
  Write-Output "Installed logon tasks: $($tasks.Name -join ', ')"
}
elseif ($Action -eq 'uninstall') {
  foreach ($t in $tasks) {
    schtasks /Delete /TN $t.Name /F | Out-Null
  }
  Write-Output "Removed logon tasks: $($tasks.Name -join ', ')"
}
else {
  Write-Error "Unknown action: $Action"
}
