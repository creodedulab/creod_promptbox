$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Creod Prompt Box local test server"
Write-Host "URL: http://localhost:5500"
Write-Host "Press Ctrl+C to stop."

node scripts/local-server.js
