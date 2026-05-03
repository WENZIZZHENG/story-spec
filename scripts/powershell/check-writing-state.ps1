$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Runtime = Resolve-Path (Join-Path $ScriptDir "..\runtime\script-runtime.js") -ErrorAction SilentlyContinue

if (-not $Runtime) {
    $Runtime = Resolve-Path (Join-Path $ScriptDir "..\..\dist\script-runtime.js") -ErrorAction SilentlyContinue
}

if (-not $Runtime) {
    Write-Error "script-runtime.js not found. Run npm run build or storyspec upgrade first."
    exit 1
}

node $Runtime.Path check-writing-state @args
