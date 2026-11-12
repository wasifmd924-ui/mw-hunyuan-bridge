$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HelperScript = Join-Path $ScriptDir "mwhunyuan_helper.py"
$PythonCmd = (Get-Command pythonw.exe -ErrorAction SilentlyContinue).Source
if (-not $PythonCmd) {
    $PythonCmd = (Get-Command python.exe -ErrorAction Stop).Source
}

$RegBase = "HKCU:\Software\Classes\mwhunyuan"
New-Item -Path $RegBase -Force | Out-Null
Set-ItemProperty -Path $RegBase -Name "(Default)" -Value "URL:MW Hunyuan Bridge Protocol"
Set-ItemProperty -Path $RegBase -Name "URL Protocol" -Value ""

$CommandPath = "$RegBase\shell\open\command"
New-Item -Path $CommandPath -Force | Out-Null
Set-ItemProperty -Path $CommandPath -Name "(Default)" -Value "`"$PythonCmd`" `"$HelperScript`" `"%1`""

Write-Host "Registered mwhunyuan:// protocol handler for current user." -ForegroundColor Green
Write-Host "Helper script: $HelperScript"

