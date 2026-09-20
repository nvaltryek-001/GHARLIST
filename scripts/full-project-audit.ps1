$ErrorActionPreference = "Continue"

$root = (Get-Location).Path
$pass = 0
$warn = 0
$fail = 0

function PASS($msg) {
    $script:pass++
    Write-Host "[PASS] $msg" -ForegroundColor Green
}

function WARN($msg) {
    $script:warn++
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function FAIL($msg) {
    $script:fail++
    Write-Host "[FAIL] $msg" -ForegroundColor Red
}

function SECTION($msg) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host $msg -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
}

SECTION "GHARLIST FULL PROJECT AUDIT"

Write-Host "Root: $root"

# ============================================================
# 1. ROOT FILES
# ============================================================

SECTION "1. PROJECT STRUCTURE"

$requiredFiles = @(
    "package.json",
    "index.html",
    "vite.config.js",
    "vercel.json",
    ".env.example",
    "src\App.jsx",
    "src\main.jsx",
    "src\styles\index.css",
    "src\store\shoppingStore.js",
    "src\components\ProductCard.jsx",
    "src\components\ProductImage.jsx",
    "src\pages\Home.jsx",
    "src\pages\Products.jsx",
    "src\pages\ProductDetail.jsx",
    "src\pages\Voice.jsx",
    "src\pages\MyList.jsx",
    "src\pages\Report.jsx",
    "src\pages\Share.jsx",
    "src\pages\History.jsx",
    "src\pages\NewList.jsx",
    "src\services\productService.js",
    "src\services\voiceService.js",
    "src\services\storageService.js",
    "src\services\reportService.js",
    "src\services\reportImageService.js",
    "src\services\shareService.js",
    "src\services\imageService.js",
    "api\image-proxy.js",
    "public\data\products.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        PASS $file
    } else {
        FAIL "Missing: $file"
    }
}

# ============================================================
# 2. PACKAGE
# ============================================================

SECTION "2. PACKAGE / DEPENDENCIES"

if (Test-Path ".\package.json") {
    try {
        $pkg = Get-Content ".\package.json" -Raw | ConvertFrom-Json

        PASS "package.json valid JSON"

        Write-Host "Name: $($pkg.name)"
        Write-Host "Version: $($pkg.version)"

        if ($pkg.scripts.dev) {
            PASS "npm dev script"
        } else {
            FAIL "npm dev script missing"
        }

        if ($pkg.scripts.build) {
            PASS "npm build script"
        } else {
            FAIL "npm build script missing"
        }

        $deps = @(
            "react",
            "react-dom",
            "react-router-dom",
            "zustand",
            "lucide-react"
        )

        foreach ($dep in $deps) {
            if ($pkg.dependencies.$dep) {
                PASS "Dependency: $dep"
            } else {
                FAIL "Missing dependency: $dep"
            }
        }
    }
    catch {
        FAIL "package.json parsing failed"
    }
}

# ============================================================
# 3. DATASET
# ============================================================

SECTION "3. PRODUCT DATASET"

$dataPath = ".\public\data\products.json"

if (Test-Path $dataPath) {
    try {
        $products = Get-Content $dataPath -Raw | ConvertFrom-Json

        if ($products -is [array]) {
            $count = $products.Count
        } else {
            $count = 1
            $products = @($products)
        }

        Write-Host "Products: $count"

        if ($count -eq 5188) {
            PASS "Exactly 5,188 products"
        } else {
            WARN "Expected 5,188 products, found $count"
        }

        $ids = @($products | ForEach-Object { $_.id })
        $duplicateIds = @(
            $ids |
            Group-Object |
            Where-Object { $_.Count -gt 1 }
        )

        if ($duplicateIds.Count -eq 0) {
            PASS "No duplicate product IDs"
        } else {
            FAIL "Duplicate product IDs found: $($duplicateIds.Count)"
        }

        $missingNames = @(
            $products |
            Where-Object { [string]::IsNullOrWhiteSpace($_.name) }
        )

        if ($missingNames.Count -eq 0) {
            PASS "All products have names"
        } else {
            FAIL "Products missing names: $($missingNames.Count)"
        }

        $missingPrices = @(
            $products |
            Where-Object {
                $null -eq $_.salePrice -and
                $null -eq $_.price -and
                $null -eq $_.mrp
            }
        )

        if ($missingPrices.Count -eq 0) {
            PASS "All products have price information"
        } else {
            WARN "Products without price information: $($missingPrices.Count)"
        }

        $missingImages = @(
            $products |
            Where-Object {
                [string]::IsNullOrWhiteSpace($_.image)
            }
        )

        if ($missingImages.Count -eq 0) {
            PASS "All products have image URLs"
        } else {
            WARN "Products without image URLs: $($missingImages.Count)"
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

        if ($categories.Count -eq 31) {
            PASS "31 product categories detected"
        } else {
            WARN "Expected 31 categories, found $($categories.Count)"
        }

        if ($brands.Count -eq 805) {
            PASS "805 brands detected"
        } else {
            WARN "Expected 805 brands, found $($brands.Count)"
        }
    }
    catch {
        FAIL "products.json could not be parsed"
    }
} else {
    FAIL "products.json missing"
}

# ============================================================
# 4. FRONTEND PAGES
# ============================================================

SECTION "4. FRONTEND PAGES"

$pages = @(
    "Home.jsx",
    "Products.jsx",
    "ProductDetail.jsx",
    "Voice.jsx",
    "MyList.jsx",
    "Report.jsx",
    "Share.jsx",
    "History.jsx",
    "NewList.jsx"
)

foreach ($page in $pages) {
    $path = ".\src\pages\$page"

    if (Test-Path $path) {
        PASS "Page: $page"
    } else {
        FAIL "Missing page: $page"
    }
}

# ============================================================
# 5. COMPONENTS
# ============================================================

SECTION "5. COMPONENTS"

$components = @(
    "Header.jsx",
    "SearchBar.jsx",
    "CategoryCard.jsx",
    "ProductCard.jsx",
    "ProductGrid.jsx",
    "ProductImage.jsx",
    "EmptyState.jsx",
    "Toast.jsx"
)

foreach ($component in $components) {
    $path = ".\src\components\$component"

    if (Test-Path $path) {
        PASS "Component: $component"
    } else {
        WARN "Missing component: $component"
    }
}

# ============================================================
# 6. SERVICES
# ============================================================

SECTION "6. SERVICES"

$services = @(
    "productService.js",
    "voiceService.js",
    "storageService.js",
    "reportService.js",
    "reportImageService.js",
    "shareService.js",
    "imageService.js"
)

foreach ($service in $services) {
    $path = ".\src\services\$service"

    if (Test-Path $path) {
        PASS "Service: $service"
    } else {
        FAIL "Missing service: $service"
    }
}

# ============================================================
# 7. ROUTES
# ============================================================

SECTION "7. ROUTES"

$appPath = ".\src\App.jsx"

if (Test-Path $appPath) {
    $appText = Get-Content $appPath -Raw

    $routes = @(
        "/",
        "/products",
        "/product/",
        "/voice",
        "/my-list",
        "/report",
        "/share",
        "/history",
        "/new-list"
    )

    foreach ($route in $routes) {
        if ($appText.Contains($route)) {
            PASS "Route: $route"
        } else {
            FAIL "Route missing: $route"
        }
    }
} else {
    FAIL "App.jsx missing"
}

# ============================================================
# 8. STORE
# ============================================================

SECTION "8. SHOPPING STORE"

$storePath = ".\src\store\shoppingStore.js"

if (Test-Path $storePath) {
    $store = Get-Content $storePath -Raw

    $storeChecks = @(
        "create(",
        "items:",
        "addItem:",
        "removeItem:",
        "increment:",
        "decrement:",
        "setQuantity:",
        "clearList:",
        "totalUnits:",
        "totalAmount:",
        "safeQty",
        "normalizeItem",
        "localStorage"
    )

    foreach ($check in $storeChecks) {
        if ($store.Contains($check)) {
            PASS "Store: $check"
        } else {
            FAIL "Store missing: $check"
        }
    }

    if ($store -match "product\?\.id") {
        PASS "Store uses product IDs"
    } else {
        WARN "Product ID matching not detected"
    }
}

# ============================================================
# 9. VOICE
# ============================================================

SECTION "9. VOICE SYSTEM"

$voicePath = ".\src\services\voiceService.js"
$voicePage = ".\src\pages\Voice.jsx"

if (Test-Path $voicePath) {
    $voice = Get-Content $voicePath -Raw

    foreach ($check in @(
        "SpeechRecognition",
        "webkitSpeechRecognition",
        "recognition.lang",
        "recognition.start",
        "recognition.stop"
    )) {
        if ($voice.Contains($check)) {
            PASS "Voice: $check"
        } else {
            WARN "Voice missing: $check"
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
            PASS "Voice locale: $locale"
        } else {
            WARN "Voice locale missing: $locale"
        }
    }

    foreach ($check in @(
        "Add All",
        "View My List",
        "startVoiceRecognition"
    )) {
        if ($vp.Contains($check)) {
            PASS "Voice UI: $check"
        } else {
            WARN "Voice UI missing: $check"
        }
    }
}

# ============================================================
# 10. MY LIST
# ============================================================

SECTION "10. MY LIST"

$myListPath = ".\src\pages\MyList.jsx"

if (Test-Path $myListPath) {
    $myList = Get-Content $myListPath -Raw

    foreach ($check in @(
        "safeQuantity",
        "safePrice",
        "quantity-control",
        "line-total",
        "shopping-list",
        "shopping-list-item",
        "shopping-list-image",
        "shopping-list-info",
        "shopping-list-actions",
        "increment",
        "decrement",
        "removeItem"
    )) {
        if ($myList.Contains($check)) {
            PASS "My List: $check"
        } else {
            WARN "My List missing: $check"
        }
    }

    if ($myList -match "NaN") {
        WARN "Literal NaN reference detected in MyList.jsx"
    } else {
        PASS "No literal NaN in MyList.jsx"
    }
}

# ============================================================
# 11. REPORT
# ============================================================

SECTION "11. REPORT SYSTEM"

$reportPath = ".\src\services\reportService.js"
$reportImagePath = ".\src\services\reportImageService.js"

if (Test-Path $reportPath) {
    $report = Get-Content $reportPath -Raw

    foreach ($check in @(
        "normalize",
        "total",
        "quantity",
        "reportToText"
    )) {
        if ($report -match $check) {
            PASS "Report service: $check"
        } else {
            WARN "Report service missing: $check"
        }
    }
} else {
    FAIL "reportService.js missing"
}

if (Test-Path $reportImagePath) {
    PASS "Report image service exists"
} else {
    FAIL "reportImageService.js missing"
}

# ============================================================
# 12. SHARE
# ============================================================

SECTION "12. SHARE SYSTEM"

$sharePath = ".\src\services\shareService.js"

if (Test-Path $sharePath) {
    $share = Get-Content $sharePath -Raw

    foreach ($check in @(
        "shareWhatsApp",
        "navigator.share",
        "wa.me",
        "shareEmail",
        "printReport",
        "copyReport"
    )) {
        if ($share.Contains($check)) {
            PASS "Share: $check"
        } else {
            WARN "Share missing: $check"
        }
    }
}

# ============================================================
# 13. IMAGE SYSTEM
# ============================================================

SECTION "13. IMAGE SYSTEM"

$imageServicePath = ".\src\services\imageService.js"

if (Test-Path $imageServicePath) {
    $imageService = Get-Content $imageServicePath -Raw

    foreach ($check in @(
        "cdn.dmart.in",
        "productImageKey",
        "getImageCandidates"
    )) {
        if ($imageService.Contains($check)) {
            PASS "Image service: $check"
        } else {
            WARN "Image service missing: $check"
        }
    }
}

# ============================================================
# 14. API / BACKEND
# ============================================================

SECTION "14. API / BACKEND"

$apiPath = ".\api\image-proxy.js"

if (Test-Path $apiPath) {
    $api = Get-Content $apiPath -Raw

    PASS "Vercel image proxy exists"

    if ($api.Contains("cdn.dmart.in")) {
        PASS "Image proxy DMart allowlist"
    } else {
        WARN "DMart allowlist not detected"
    }

    if ($api.Contains("fetch")) {
        PASS "Image proxy uses fetch"
    } else {
        WARN "Image proxy fetch not detected"
    }

    if ($api.Contains("GET")) {
        PASS "GET handling detected"
    }
}

if (Test-Path ".\vercel.json") {
    $vercel = Get-Content ".\vercel.json" -Raw

    if ($vercel.Contains("api/")) {
        PASS "Vercel API configuration"
    }

    if ($vercel.Contains("index.html")) {
        PASS "SPA rewrite configured"
    }
} else {
    FAIL "vercel.json missing"
}

# ============================================================
# 15. IMAGE PROXY CONFIG
# ============================================================

SECTION "15. VITE IMAGE PROXY"

if (Test-Path ".\vite.config.js") {
    $vite = Get-Content ".\vite.config.js" -Raw

    if ($vite.Contains("/api/image-proxy")) {
        PASS "Vite image proxy configured"
    } else {
        WARN "Vite image proxy route not detected"
    }
}

# ============================================================
# 16. SOURCE ERROR SCAN
# ============================================================

SECTION "16. SOURCE ERROR SCAN"

$sourceFiles = Get-ChildItem ".\src" -Recurse -Include *.js,*.jsx,*.css

$nanMatches = @(
    $sourceFiles |
    Select-String -Pattern "NaN" -SimpleMatch
)

if ($nanMatches.Count -eq 0) {
    PASS "No literal NaN references in source"
} else {
    WARN "NaN references found: $($nanMatches.Count)"
    $nanMatches | Select-Object -First 10
}

$todoMatches = @(
    $sourceFiles |
    Select-String -Pattern "TODO|FIXME" -CaseSensitive:$false
)

if ($todoMatches.Count -eq 0) {
    PASS "No TODO/FIXME markers"
} else {
    WARN "TODO/FIXME markers found: $($todoMatches.Count)"
}

# ============================================================
# 17. BUILD
# ============================================================

SECTION "17. PRODUCTION BUILD"

npm run build

if ($LASTEXITCODE -eq 0) {
    PASS "Production build"
} else {
    FAIL "Production build failed"
}

# ============================================================
# 18. DIST
# ============================================================

SECTION "18. DIST OUTPUT"

if (Test-Path ".\dist\index.html") {
    PASS "dist/index.html exists"
} else {
    FAIL "dist/index.html missing"
}

$distAssets = @(Get-ChildItem ".\dist\assets" -ErrorAction SilentlyContinue)

if ($distAssets.Count -gt 0) {
    PASS "dist assets generated: $($distAssets.Count)"
} else {
    FAIL "No dist assets"
}

# ============================================================
# 19. LOCAL SERVER
# ============================================================

SECTION "19. LOCAL RUNTIME"

$base = "http://localhost:5173"

try {
    $response = Invoke-WebRequest "$base/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        PASS "GET /"
    }
} catch {
    WARN "Local Vite server not running on port 5173"
}

$runtimeRoutes = @(
    "/",
    "/products",
    "/voice",
    "/my-list",
    "/report",
    "/share",
    "/history",
    "/new-list"
)

foreach ($route in $runtimeRoutes) {
    try {
        $response = Invoke-WebRequest "$base$route" -UseBasicParsing -TimeoutSec 5

        if ($response.StatusCode -eq 200) {
            PASS "Runtime $route"
        } else {
            WARN "Runtime $route returned $($response.StatusCode)"
        }
    } catch {
        WARN "Runtime unavailable: $route"
    }
}

# ============================================================
# 20. DATA HTTP
# ============================================================

SECTION "20. DATA HTTP"

try {
    $dataResponse = Invoke-WebRequest "$base/data/products.json" -UseBasicParsing -TimeoutSec 10

    if ($dataResponse.StatusCode -eq 200) {
        PASS "products.json HTTP 200"

        try {
            $httpProducts = $dataResponse.Content | ConvertFrom-Json

            if ($httpProducts.Count -eq 5188) {
                PASS "HTTP dataset contains 5,188 products"
            } else {
                WARN "HTTP dataset contains $($httpProducts.Count) products"
            }
        }
        catch {
            FAIL "HTTP products.json is not valid JSON"
        }
    }
}
catch {
    WARN "Could not fetch products.json"
}

# ============================================================
# 21. SUMMARY
# ============================================================

SECTION "FINAL AUDIT SUMMARY"

Write-Host ""
Write-Host "PASS : $pass" -ForegroundColor Green
Write-Host "WARN : $warn" -ForegroundColor Yellow
Write-Host "FAIL : $fail" -ForegroundColor Red
Write-Host ""

if ($fail -eq 0) {
    Write-Host "PROJECT STRUCTURE: PASS" -ForegroundColor Green
} else {
    Write-Host "PROJECT STRUCTURE: NEEDS FIXES" -ForegroundColor Red
}

if ($warn -eq 0) {
    Write-Host "WARNINGS: NONE" -ForegroundColor Green
} else {
    Write-Host "WARNINGS: REVIEW ABOVE" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "GHARLIST AUDIT FINISHED"
Write-Host ""
