$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Write-Host 'ScopePay sandbox setup. Secrets stay in this process and are never printed or saved.'
$taskAiBase = Read-Host 'AI API base URL including /v1 (Enter for rehearsal)'
if ($taskAiBase) {
    $env:AI_BASE_URL = $taskAiBase
    $env:AI_MODEL = Read-Host 'AI model name or local server alias'
    $taskAiKey = Read-Host 'AI API key (Enter if local server needs none)' -AsSecureString
    $env:AI_API_KEY = [System.Net.NetworkCredential]::new('', $taskAiKey).Password
}
$env:PAYPAL_CLIENT_ID = Read-Host 'PayPal SANDBOX client ID (Enter to skip checkout)'
if ($env:PAYPAL_CLIENT_ID) {
    $taskPayPalSecret = Read-Host 'PayPal SANDBOX client secret' -AsSecureString
    $env:PAYPAL_CLIENT_SECRET = [System.Net.NetworkCredential]::new('', $taskPayPalSecret).Password
}
try { & node --env-file-if-exists=.env server.mjs }
finally { Remove-Item Env:AI_API_KEY -ErrorAction SilentlyContinue; Remove-Item Env:PAYPAL_CLIENT_SECRET -ErrorAction SilentlyContinue }
