$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Runtime = Resolve-Path (Join-Path $ScriptDir "..\runtime\script-runtime.js") -ErrorAction SilentlyContinue

if ($Runtime) {
    node $Runtime.Path validate-local @args
    exit $LASTEXITCODE
}

$StorySpecCommand = Get-Command storyspec -ErrorAction SilentlyContinue
if ($StorySpecCommand) {
    storyspec validate @args
    exit $LASTEXITCODE
}

Write-Host "StorySpec local fallback validation"
Write-Host "Runtime and storyspec command were not found; running lightweight checks."

$Root = Resolve-Path (Join-Path $ScriptDir "..\..")
$Failures = New-Object System.Collections.Generic.List[string]

function Add-Failure($message) {
    $Failures.Add($message) | Out-Null
}

foreach ($relative in @("CONTINUE.md", ".specify\config.json", "stories", "spec\tracking")) {
    $target = Join-Path $Root $relative
    if (-not (Test-Path -LiteralPath $target)) {
        Add-Failure "missing: $relative"
    }
}

$jsonRoot = Join-Path $Root "spec\tracking"
if (Test-Path -LiteralPath $jsonRoot) {
    Get-ChildItem -LiteralPath $jsonRoot -Filter "*.json" | ForEach-Object {
        try {
            Get-Content -LiteralPath $_.FullName -Encoding utf8 -Raw | ConvertFrom-Json | Out-Null
        } catch {
            Add-Failure "invalid json: spec/tracking/$($_.Name)"
        }
    }
}

if ($Failures.Count -gt 0) {
    Write-Host "Failures: $($Failures.Count)"
    foreach ($failure in $Failures) {
        Write-Host "  [FAIL] $failure"
    }
    exit 1
}

Write-Host "Lightweight validation passed."
exit 0
