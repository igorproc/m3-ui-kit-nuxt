# Сохраните как audit.ps1 и запустите: powershell -File audit.ps1
# ИЛИ просто копируйте команды по одной в PowerShell

$base = "https://raw.githubusercontent.com/igorproc/m3-ui-kit-nuxt/nightwatch"

# 1. Список всех файлов (рекурсивно, без мусора)
function Get-AllFiles($path = ".", $prefix = "") {
    $excludes = @("node_modules",".git","dist",".nuxt","coverage",".output")
    $items = Get-ChildItem $path -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        if ($excludes -contains $item.Name) { continue }
        $name = $prefix + $item.Name
        if ($item.PSIsContainer) {
            Write-Output ($name + "/")
            Get-AllFiles $item.FullName ($name + "/")
        } else {
            Write-Output $name
        }
    }
}

Write-Output "=== FILE TREE ==="
Get-AllFiles | Sort-Object

Write-Output ""
Write-Output "=== RAW GITHUB URLs ==="
Get-AllFiles | Where-Object { -not $_.EndsWith("/") } | ForEach-Object { 
    Write-Output ($base + "/" + $_)
}

Write-Output ""
Write-Output "=== CONFIG FILES ==="
Get-Content package.json -Raw -ErrorAction SilentlyContinue
Get-Content nuxt.config.ts -Raw -ErrorAction SilentlyContinue

Write-Output ""
Write-Output "=== MODULE ==="
Get-Content app/modules/kit/module.ts -Raw -ErrorAction SilentlyContinue

Write-Output ""
Write-Output "=== TOKEN FUNCTIONS ==="
Get-Content app/assets/stylesheet/abstracts/_functions.scss -Raw -ErrorAction SilentlyContinue

Write-Output ""
Write-Output "=== TOKEN VARIABLES ==="
Get-Content app/assets/stylesheet/abstracts/_variables.scss -Raw -ErrorAction SilentlyContinue

Write-Output ""
Write-Output "=== COMPONENTS ==="
$comps = Get-ChildItem app/components/ui -Directory -ErrorAction SilentlyContinue
foreach ($c in $comps) {
    $vue = "app/components/ui/" + $c.Name + "/index.vue"
    $scss = "app/assets/stylesheet/components/" + $c.Name + "/index.scss"
    Write-Output ("--- COMPONENT: " + $c.Name + " ---")
    if (Test-Path $vue) { Get-Content $vue -Raw }
    if (Test-Path $scss) { Write-Output "/* SCSS */"; Get-Content $scss -Raw }
}

Write-Output ""
Write-Output "=== COMPOSABLES ==="
Get-ChildItem app/composables -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Output ("--- " + $_.Name + " ---")
    Get-Content $_.FullName -Raw
}

Write-Output ""
Write-Output "=== STORES ==="
Get-ChildItem app/store -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Output ("--- " + $_.Name + " ---")
    Get-Content $_.FullName -Raw
}

Write-Output ""
Write-Output "=== SHARED ==="
Get-ChildItem shared -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Output ("--- " + $_.FullName.Replace((Get-Location).Path + "\", "") + " ---")
    Get-Content $_.FullName -Raw
}

Write-Output ""
Write-Output "=== TESTS ==="
Get-ChildItem tests -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Output ("--- " + $_.Name + " ---")
    Get-Content $_.FullName -Raw
}