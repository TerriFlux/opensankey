# Init all submodules recursively, then deinit the nested TestData/ working trees.
# Only SA/SankeyData/ remains populated (the single shared test+content data source).
$ErrorActionPreference = "Stop"

$saRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $saRoot

git submodule update --init --recursive

# Parents of nested TestData submodules — deinit must run from each parent.
$nestedParents = @(
    "submodules/MFAProblem",
    "submodules/OpenSankey+",
    "submodules/OpenSankey+/submodules/OpenSankey",
    "submodules/OpenSankey+/submodules/OpenSankey/submodules/SankeyExcelParser"
)

foreach ($parent in $nestedParents) {
    if (Test-Path "$parent/TestData") {
        git -C $parent submodule deinit -f TestData
    }
}

Write-Host ""
Write-Host "SankeyData populated at: $saRoot/SankeyData"
Write-Host "Set TESTS_DIR=$saRoot/SankeyData/tests in your environment (see start_vscode.bat)."
