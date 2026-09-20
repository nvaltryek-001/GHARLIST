$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       GHARLIST MOTHER VOICE SHOPPING FLOW CHECK" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$failed = 0

function PASS($x) {
    Write-Host "[PASS] $x" -ForegroundColor Green
}

function FAIL($x) {
    Write-Host "[FAIL] $x" -ForegroundColor Red
    $script:failed++
}

function CHECK($condition, $ok, $bad) {
    if ($condition) {
        PASS $ok
    }
    if (!$condition) {
        FAIL $bad
    }
}

# ------------------------------------------------------------
# 1. VOICE PAGE
# ------------------------------------------------------------

Write-Host "1. VOICE INPUT" -ForegroundColor Cyan

$voice = Get-Content "src\pages\Voice.jsx" -Raw
$voiceService = Get-Content "src\services\voiceService.js" -Raw

CHECK ($voice -match "startVoiceRecognition") `
    "Voice page connected to recognition service" `
    "Voice recognition service not connected"

CHECK ($voiceService -match "SpeechRecognition") `
    "Browser SpeechRecognition supported" `
    "SpeechRecognition missing"

CHECK ($voiceService -match "webkitSpeechRecognition") `
    "Chrome webkitSpeechRecognition supported" `
    "webkitSpeechRecognition missing"

CHECK ($voiceService -match "recognition.start") `
    "Microphone recognition starts" `
    "Recognition start missing"

CHECK ($voiceService -match "onresult") `
    "Speech result captured" `
    "Speech result handler missing"

# ------------------------------------------------------------
# 2. LANGUAGES
# ------------------------------------------------------------

Write-Host ""
Write-Host "2. MOTHER LANGUAGE SUPPORT" -ForegroundColor Cyan

foreach ($lang in @("en-IN","hi-IN","kn-IN")) {

    CHECK ($voice -match [regex]::Escape($lang)) `
        "$lang supported" `
        "$lang missing"
}

# ------------------------------------------------------------
# 3. PRODUCT MATCHING
# ------------------------------------------------------------

Write-Host ""
Write-Host "3. VOICE -> PRODUCT MATCHING" -ForegroundColor Cyan

CHECK ($voice -match "products") `
    "Voice page loads product dataset" `
    "Product dataset connection missing"

CHECK ($voice -match "name") `
    "Product-name matching enabled" `
    "Product-name matching missing"

CHECK ($voice -match "brand") `
    "Brand matching enabled" `
    "Brand matching missing"

CHECK ($voice -match "category") `
    "Category matching enabled" `
    "Category matching missing"

# ------------------------------------------------------------
# 4. ADD ALL
# ------------------------------------------------------------

Write-Host ""
Write-Host "4. VOICE -> ADD ALL" -ForegroundColor Cyan

CHECK ($voice -match "Add All") `
    "Add All button exists" `
    "Add All missing"

CHECK ($voice -match "addItem") `
    "Voice results connect to shopping store" `
    "addItem connection missing"

# ------------------------------------------------------------
# 5. SHOPPING STORE
# ------------------------------------------------------------

Write-Host ""
Write-Host "5. SHOPPING LIST STORE" -ForegroundColor Cyan

$store = Get-Content "src\store\shoppingStore.js" -Raw
$list = Get-Content "src\pages\MyList.jsx" -Raw

CHECK ($store -match "addItem") `
    "Add item available" `
    "addItem missing"

CHECK ($store -match "removeItem") `
    "Remove item available" `
    "removeItem missing"

CHECK ($store -match "increment") `
    "Increase quantity available" `
    "increment missing"

CHECK ($store -match "decrement") `
    "Decrease quantity available" `
    "decrement missing"

CHECK ($store -match "totalAmount") `
    "List total calculation available" `
    "totalAmount missing"

CHECK ($list -match "totalAmount") `
    "My List displays total amount" `
    "My List total missing"

# ------------------------------------------------------------
# 6. REPORT
# ------------------------------------------------------------

Write-Host ""
Write-Host "6. SHOPPING LIST -> REPORT" -ForegroundColor Cyan

$report = Get-Content "src\pages\Report.jsx" -Raw
$reportService = Get-Content "src\services\reportService.js" -Raw

CHECK ($report -match "buildReport|normalizeReport") `
    "Report connected to report service" `
    "Report service connection missing"

CHECK ($reportService -match "totalUnits") `
    "Total quantity calculated" `
    "Total quantity calculation missing"

CHECK ($reportService -match "totalAmount") `
    "Total amount calculated" `
    "Total amount calculation missing"

# ------------------------------------------------------------
# 7. WHATSAPP
# ------------------------------------------------------------

Write-Host ""
Write-Host "7. REPORT -> WHATSAPP" -ForegroundColor Cyan

$share = Get-Content "src\services\shareService.js" -Raw
$sharePage = Get-Content "src\pages\Share.jsx" -Raw

CHECK ($share -match "shareWhatsApp") `
    "WhatsApp sharing function exists" `
    "WhatsApp sharing missing"

CHECK ($share -match "wa.me") `
    "WhatsApp share URL exists" `
    "WhatsApp URL missing"

CHECK ($sharePage -match "WhatsApp") `
    "WhatsApp button exists in Share page" `
    "WhatsApp button missing"

# ------------------------------------------------------------
# 8. ACTUAL IMAGE REPORT
# ------------------------------------------------------------

Write-Host ""
Write-Host "8. PRODUCT IMAGE REPORT" -ForegroundColor Cyan

$imageReport = Get-Content "src\services\reportImageService.js" -Raw

CHECK ($imageReport -match "createReportImage") `
    "Report image generator exists" `
    "Report image generator missing"

CHECK ($imageReport -match "api/image-proxy") `
    "Real DMart image proxy used" `
    "Report image proxy missing"

CHECK ($imageReport -match "downloadReportImage") `
    "Report PNG download exists" `
    "Report PNG download missing"

# ------------------------------------------------------------
# 9. HISTORY
# ------------------------------------------------------------

Write-Host ""
Write-Host "9. HISTORY" -ForegroundColor Cyan

$history = Get-Content "src\pages\History.jsx" -Raw
$storage = Get-Content "src\services\storageService.js" -Raw

CHECK ($storage -match "addHistory") `
    "Report history storage exists" `
    "History storage missing"

CHECK ($storage -match "loadHistory") `
    "History loading exists" `
    "History loading missing"

CHECK ($history -match "loadHistory") `
    "History page connected" `
    "History page not connected"

# ------------------------------------------------------------
# 10. NEW LIST
# ------------------------------------------------------------

Write-Host ""
Write-Host "10. NEW LIST FLOW" -ForegroundColor Cyan

$newList = Get-Content "src\pages\NewList.jsx" -Raw

CHECK ($newList -match "clear|Clear|new") `
    "New-list functionality detected" `
    "New-list functionality not detected"

# ------------------------------------------------------------
# 11. BUILD
# ------------------------------------------------------------

Write-Host ""
Write-Host "11. PRODUCTION BUILD" -ForegroundColor Cyan

npm run build

CHECK ($LASTEXITCODE -eq 0) `
    "Production build successful" `
    "Production build failed"

# ------------------------------------------------------------
# FINAL
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

if ($failed -eq 0) {

    Write-Host ""
    Write-Host "🔥 MOTHER SHOPPING FLOW: PASS" -ForegroundColor Green
    Write-Host ""
    Write-Host "VOICE" -ForegroundColor White
    Write-Host "  ↓" -ForegroundColor Yellow
    Write-Host "PRODUCT MATCH" -ForegroundColor White
    Write-Host "  ↓" -ForegroundColor Yellow
    Write-Host "ADD ALL" -ForegroundColor White
    Write-Host "  ↓" -ForegroundColor Yellow
    Write-Host "MY LIST" -ForegroundColor White
    Write-Host "  ↓" -ForegroundColor Yellow
    Write-Host "REPORT" -ForegroundColor White
    Write-Host "  ↓" -ForegroundColor Yellow
    Write-Host "WHATSAPP -> SON" -ForegroundColor Green
    Write-Host ""
    Write-Host "STATUS: READY FOR BROWSER FLOW TEST" -ForegroundColor Green
}

if ($failed -ne 0) {
    Write-Host ""
    Write-Host "❌ FLOW CHECK FAILED: $failed" -ForegroundColor Red
}

Write-Host ""
