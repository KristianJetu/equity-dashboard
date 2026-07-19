# Test skript - simuluje mBank email pres Resend webhook
# Vloz text emailu mezi EOF znacky nize

$emailText = @"
ZDE VLOZ TEXT MBANK EMAILU
"@

$payload = @{
    type = "email.received"
    created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.000Z")
    data = @{
        from = "kontakt@mbank.cz"
        to = @("platby@xamgra.resend.app")
        subject = "Notifikace o prijate platbe"
        text = $emailText
        html = ""
    }
} | ConvertTo-Json -Depth 5

Write-Host "Posilam testovaci email na webhook..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod `
        -Uri "https://equity-dashboard-six.vercel.app/api/inbound-email" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload

    Write-Host "Odpoved webhoku:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "Chyba:" -ForegroundColor Red
    $_.Exception.Message
}
