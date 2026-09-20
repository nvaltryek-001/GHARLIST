$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " GHARLIST — COMPLETE ARCHITECTURE + QA INSPECTION" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$root = (Get-Location).Path

# ----------------------------------------------------
# 1. APP.JSX
# ----------------------------------------------------

Write-Host ""
Write-Host "================ APP.JSX ================" -ForegroundColor Yellow

if (Test-Path ".\src\App.jsx") {
    Get-Content ".\src\App.jsx"
} else {
    Write-Host "APP.JSX NOT FOUND" -ForegroundColor Red
}

# ----------------------------------------------------
# 2. COMPLETE SRC TREE
# ----------------------------------------------------

Write-Host ""
Write-Host "================ SRC TREE ================" -ForegroundColor Yellow

Get-ChildItem ".\src" -Recurse -File |
    Sort-Object FullName |
    ForEach-Object {
        $relative = $_.FullName.Substring($root.Length + 1)
        Write-Host $relative
    }

# ----------------------------------------------------
# 3. PAGE FILES
# ----------------------------------------------------

Write-Host ""
Write-Host "================ PAGES ================" -ForegroundColor Yellow

Get-ChildItem ".\src\pages" -File -ErrorAction SilentlyContinue |
    Sort-Object Name |
    ForEach-Object {
        Write-Host "[PAGE] $($_.Name)"
    }

# ----------------------------------------------------
# 4. COMPONENT FILES
# ----------------------------------------------------

Write-Host ""
Write-Host "================ COMPONENTS ================" -ForegroundColor Yellow

Get-ChildItem ".\src\components" -File -ErrorAction SilentlyContinue |
    Sort-Object Name |
    ForEach-Object {
        Write-Host "[COMPONENT] $($_.Name)"
    }

# ----------------------------------------------------
# 5. SERVICES
# ----------------------------------------------------

Write-Host ""
Write-Host "================ SERVICES ================" -ForegroundColor Yellow

Get-ChildItem ".\src\services" -File -ErrorAction SilentlyContinue |
    Sort-Object Name |
    ForEach-Object {
        Write-Host "[SERVICE] $($_.Name)"
    }

# ----------------------------------------------------
# 6. STORE
# ----------------------------------------------------

Write-Host ""
Write-Host "================ STORE ================" -ForegroundColor Yellow

if (Test-Path ".\src\store") {
    Get-ChildItem ".\src\store" -File |
        Sort-Object Name |
        ForEach-Object {
            Write-Host "[STORE] $($_.Name)"
        }
}

# ----------------------------------------------------
# 7. APP ROUTING EXTRACTION
# ----------------------------------------------------

Write-Host ""
Write-Host "================ ROUTING REFERENCES ================" -ForegroundColor Yellow

$app = ""

if (Test-Path ".\src\App.jsx") {
    $app = Get-Content ".\src\App.jsx" -Raw
}

Write-Host ""
Write-Host "--- Route declarations ---"

[regex]::Matches(
    $app,
    '(?:"|''|`)(/[^"''` ]*)(?:"|''|`)'
) |
ForEach-Object {
    Write-Host "[ROUTE] $($_.Groups[1].Value)"
}

Write-Host ""
Write-Host "--- Page imports ---"

[regex]::Matches(
    $app,
    'import\s+([A-Za-z0-9_]+)\s+from\s+["'']([^"'']+)["'']'
) |
ForEach-Object {
    $name = $_.Groups[1].Value
    $path = $_.Groups[2].Value

    if ($path -match 'pages|components') {
        Write-Host "[IMPORT] $name <- $path"
    }
}

# ----------------------------------------------------
# 8. ROOT ROUTE DETECTION
# ----------------------------------------------------

Write-Host ""
Write-Host "================ ROOT ROUTE ANALYSIS ================" -ForegroundColor Yellow

if ($app -match 'path\s*=\s*["'']\/["'']') {
    Write-Host "[FOUND] Root route /" -ForegroundColor Green
}

$rootLines = $app -split "`r?`n" |
    Where-Object {
        $_ -match 'path\s*=\s*["'']\/["'']|Route|element='
    }

$rootLines | ForEach-Object {
    Write-Host $_
}

# ----------------------------------------------------
# 9. PRODUCT CARD ANALYSIS
# ----------------------------------------------------

Write-Host ""
Write-Host "================ PRODUCT CARD ANALYSIS ================" -ForegroundColor Yellow

$productCardPath = ".\src\components\ProductCard.jsx"

if (Test-Path $productCardPath) {

    $pc = Get-Content $productCardPath -Raw

    if ($pc.Contains("useShoppingStore")) {
        Write-Host "[PASS] ProductCard uses shopping store" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] ProductCard does not use shopping store" -ForegroundColor Red
    }

    if ($pc.Contains("addItem")) {
        Write-Host "[PASS] ProductCard has addItem" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] ProductCard addItem missing" -ForegroundColor Red
    }

    if ($pc.Contains("setAdded(true)")) {
        Write-Host "[FOUND] Temporary Added state" -ForegroundColor Yellow
    }

    if ($pc.Contains("setTimeout")) {
        Write-Host "[FOUND] Added state timeout" -ForegroundColor Yellow
    }

    if ($pc.Contains("items")) {
        Write-Host "[FOUND] Store items state" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] ProductCard does not subscribe to store items" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "--- ProductCard source ---"
    Get-Content $productCardPath
}

# ----------------------------------------------------
# 10. STORE ANALYSIS
# ----------------------------------------------------

Write-Host ""
Write-Host "================ STORE ANALYSIS ================" -ForegroundColor Yellow

$storePath = ".\src\store\shoppingStore.js"

if (Test-Path $storePath) {

    $store = Get-Content $storePath -Raw

    $storeChecks = @(
        "items:",
        "addItem:",
        "removeItem:",
        "increment:",
        "decrement:",
        "setQuantity:",
        "clearList:",
        "totalUnits:",
        "totalAmount:",
        "normalizeItem",
        "safeQty",
        "localStorage"
    )

    foreach ($check in $storeChecks) {
        if ($store.Contains($check)) {
            Write-Host "[PASS] $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $check" -ForegroundColor Red
        }
    }
}

# ----------------------------------------------------
# 11. MY LIST ANALYSIS
# ----------------------------------------------------

Write-Host ""
Write-Host "================ MY LIST ANALYSIS ================" -ForegroundColor Yellow

$myListPath = ".\src\pages\MyList.jsx"

if (Test-Path $myListPath) {

    $ml = Get-Content $myListPath -Raw

    $myListChecks = @(
        "safeQuantity",
        "safePrice",
        "shopping-list",
        "shopping-list-item",
        "shopping-list-image",
        "shopping-list-info",
        "shopping-list-actions",
        "quantity-control",
        "line-total",
        "increment",
        "decrement",
        "removeItem"
    )

    foreach ($check in $myListChecks) {
        if ($ml.Contains($check)) {
            Write-Host "[PASS] $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $check" -ForegroundColor Red
        }
    }
}

# ----------------------------------------------------
# 12. CSS MATCHING
# ----------------------------------------------------

Write-Host ""
Write-Host "================ MY LIST CSS ================" -ForegroundColor Yellow

$cssPath = ".\src\styles\index.css"

if (Test-Path $cssPath) {

    $css = Get-Content $cssPath -Raw

    $cssChecks = @(
        ".shopping-list",
        ".shopping-list-item",
        ".shopping-list-image",
        ".shopping-list-info",
        ".shopping-list-actions",
        ".quantity-control",
        ".line-total",
        ".list-summary",
        ".list-footer-actions"
    )

    foreach ($check in $cssChecks) {
        if ($css.Contains($check)) {
            Write-Host "[PASS] CSS $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] CSS $check" -ForegroundColor Red
        }
    }
}

# ----------------------------------------------------
# 13. VOICE
# ----------------------------------------------------

Write-Host ""
Write-Host "================ VOICE ================" -ForegroundColor Yellow

$voiceService = ".\src\services\voiceService.js"
$voicePage = ".\src\pages\Voice.jsx"

if (Test-Path $voiceService) {

    $vs = Get-Content $voiceService -Raw

    foreach ($check in @(
        "SpeechRecognition",
        "webkitSpeechRecognition",
        "recognition.lang",
        "recognition.start",
        "recognition.stop"
    )) {
        if ($vs.Contains($check)) {
            Write-Host "[PASS] $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $check" -ForegroundColor Red
        }
    }
}

if (Test-Path $voicePage) {

    $vp = Get-Content $voicePage -Raw

    foreach ($locale in @(
        "en-IN",
        "hi-IN",
        "kn-IN"
    )) {
        if ($vp.Contains($locale)) {
            Write-Host "[PASS] $locale" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $locale" -ForegroundColor Red
        }
    }

    foreach ($check in @(
        "Add All",
        "View My List",
        "startVoiceRecognition"
    )) {
        if ($vp.Contains($check)) {
            Write-Host "[PASS] $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $check" -ForegroundColor Red
        }
    }
}

# ----------------------------------------------------
# 14. REPORT
# ----------------------------------------------------

Write-Host ""
Write-Host "================ REPORT ================" -ForegroundColor Yellow

$reportFiles = @(
    ".\src\services\reportService.js",
    ".\src\services\reportImageService.js",
    ".\src\pages\Report.jsx"
)

foreach ($file in $reportFiles) {
    if (Test-Path $file) {
        Write-Host "[PASS] $file" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $file" -ForegroundColor Red
    }
}

# ----------------------------------------------------
# 15. SHARE
# ----------------------------------------------------

Write-Host ""
Write-Host "================ SHARE ================" -ForegroundColor Yellow

$sharePath = ".\src\services\shareService.js"

if (Test-Path $sharePath) {

    $share = Get-Content $sharePath -Raw

    foreach ($check in @(
        "shareWhatsApp",
        "wa.me",
        "navigator.share",
        "shareEmail",
        "printReport",
        "copyReport"
    )) {
        if ($share.Contains($check)) {
            Write-Host "[PASS] $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $check" -ForegroundColor Red
        }
    }
}

# ----------------------------------------------------
# 16. DATASET
# ----------------------------------------------------

Write-Host ""
Write-Host "================ DATASET ================" -ForegroundColor Yellow

$dataPath = ".\public\data\products.json"

if (Test-Path $dataPath) {

    try {

        $data = Get-Content $dataPath -Raw | ConvertFrom-Json

        if ($data -is [array]) {
            $products = @($data)
        } else {
            $products = @($data)
        }

        Write-Host "Products: $($products.Count)"

        if ($products.Count -eq 5188) {
            Write-Host "[PASS] 5,188 products" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Product count: $($products.Count)" -ForegroundColor Yellow
        }

        $ids = @(
            $products |
            ForEach-Object { $_.id } |
            Where-Object { $_ }
        )

        $dupes = @(
            $ids |
            Group-Object |
            Where-Object { $_.Count -gt 1 }
        )

        if ($dupes.Count -eq 0) {
            Write-Host "[PASS] No duplicate IDs" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] Duplicate IDs: $($dupes.Count)" -ForegroundColor Red
        }

        $categories = @(
            $products |
            ForEach-Object { $_.category } |
            Where-Object { $_ } |
            Sort-Object -Unique
        )

        $brands = @(
            $products |
            ForEach-Object { $_.brand } |
            Where-Object { $_ } |
            Sort-Object -Unique
        )

        Write-Host "Categories: $($categories.Count)"
        Write-Host "Brands: $($brands.Count)"

    } catch {
        Write-Host "[FAIL] products.json parse failed" -ForegroundColor Red
    }
}

# ----------------------------------------------------
# 17. IMAGE SYSTEM
# ----------------------------------------------------

Write-Host ""
Write-Host "================ IMAGE SYSTEM ================" -ForegroundColor Yellow

foreach ($file in @(
    ".\src\services\imageService.js",
    ".\src\components\ProductImage.jsx",
    ".\api\image-proxy.js"
)) {
    if (Test-Path $file) {
        Write-Host "[PASS] $file" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $file" -ForegroundColor Red
    }
}

if (Test-Path ".\src\services\imageService.js") {

    $is = Get-Content ".\src\services\imageService.js" -Raw

    foreach ($check in @(
        "cdn.dmart.in",
        "productImageKey",
        "getImageCandidates"
    )) {
        if ($is.Contains($check)) {
            Write-Host "[PASS] $check" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $check" -ForegroundColor Red
        }
    }
}

# ----------------------------------------------------
# 18. DEPLOYMENT
# ----------------------------------------------------

Write-Host ""
Write-Host "================ DEPLOYMENT ================" -ForegroundColor Yellow

if (Test-Path ".\vercel.json") {
    Write-Host "[PASS] vercel.json" -ForegroundColor Green
    Get-Content ".\vercel.json"
} else {
    Write-Host "[FAIL] vercel.json" -ForegroundColor Red
}

if (Test-Path ".\api\image-proxy.js") {
    Write-Host "[PASS] API image proxy" -ForegroundColor Green
}

# ----------------------------------------------------
# 19. ENV
# ----------------------------------------------------

Write-Host ""
Write-Host "================ ENVIRONMENT ================" -ForegroundColor Yellow

if (Test-Path ".\.env.example") {
    Write-Host "[PASS] .env.example" -ForegroundColor Green
    Get-Content ".\.env.example"
} else {
    Write-Host "[WARN] .env.example missing" -ForegroundColor Yellow
}

# ----------------------------------------------------
# 20. SOURCE ERROR SCAN
# ----------------------------------------------------

Write-Host ""
Write-Host "================ SOURCE SCAN ================" -ForegroundColor Yellow

$sourceFiles = @(
    Get-ChildItem ".\src" -Recurse -File -Include *.js,*.jsx,*.css
)

$nan = @(
    $sourceFiles |
    Select-String -Pattern "NaN" -SimpleMatch
)

if ($nan.Count -eq 0) {
    Write-Host "[PASS] No NaN references" -ForegroundColor Green
} else {
    Write-Host "[WARN] NaN references found: $($nan.Count)" -ForegroundColor Yellow
    $nan | Select-Object -First 20
}

$todo = @(
    $sourceFiles |
    Select-String -Pattern "TODO|FIXME" -CaseSensitive:$false
)

if ($todo.Count -eq 0) {
    Write-Host "[PASS] No TODO/FIXME" -ForegroundColor Green
} else {
    Write-Host "[WARN] TODO/FIXME found: $($todo.Count)" -ForegroundColor Yellow
}

# ----------------------------------------------------
# 21. BUILD
# ----------------------------------------------------

Write-Host ""
Write-Host "================ PRODUCTION BUILD ================" -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] npm run build" -ForegroundColor Green
} else {
    Write-Host "[FAIL] npm run build" -ForegroundColor Red
}

# ----------------------------------------------------
# 22. RUNTIME
# ----------------------------------------------------

Write-Host ""
Write-Host "================ LOCAL RUNTIME ================" -ForegroundColor Yellow

$base = "http://localhost:5173"

$routes = @(
    "/",
    "/products",
    "/voice",
    "/my-list",
    "/report",
    "/share",
    "/history",
    "/new-list"
)

foreach ($route in $routes) {

    try {

        $r = Invoke-WebRequest `
            "$base$route" `
            -UseBasicParsing `
            -TimeoutSec 5

        if ($r.StatusCode -eq 200) {
            Write-Host "[PASS] $route -> HTTP 200" -ForegroundColor Green
        } else {
            Write-Host "[WARN] $route -> HTTP $($r.StatusCode)" -ForegroundColor Yellow
        }

    } catch {

        Write-Host "[WARN] $route -> server unavailable" -ForegroundColor Yellow
    }
}

# ----------------------------------------------------
# 23. DATA RUNTIME
# ----------------------------------------------------

Write-Host ""
Write-Host "================ DATA RUNTIME ================" -ForegroundColor Yellow

try {

    $r = Invoke-WebRequest `
        "$base/data/products.json" `
        -UseBasicParsing `
        -TimeoutSec 10

    if ($r.StatusCode -eq 200) {

        $httpData = $r.Content | ConvertFrom-Json

        if ($httpData.Count -eq 5188) {
            Write-Host "[PASS] Runtime dataset = 5,188" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Runtime dataset = $($httpData.Count)" -ForegroundColor Yellow
        }

    }

} catch {

    Write-Host "[WARN] Runtime dataset unavailable" -ForegroundColor Yellow
}

# ----------------------------------------------------
# 24. FINAL STATUS
# ----------------------------------------------------

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " INSPECTION COMPLETE" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "IMPORTANT:"
Write-Host "1. This inspection did NOT modify source files."
Write-Host "2. It inspected the REAL current App.jsx."
Write-Host "3. It inspected the REAL current src tree."
Write-Host "4. It checked the current ProductCard Added-state implementation."
Write-Host "5. It checked Store/MyList/Voice/Report/Share/Data/API."
Write-Host "6. It ran production build."
Write-Host "7. It checked local runtime routes."

Write-Host ""
Write-Host "END OF GHARLIST INSPECTION"
