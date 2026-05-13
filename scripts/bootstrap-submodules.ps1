# Init all submodules recursively, then deinit the nested TestData/ working trees.
# Only SA/TestData/ remains populated (the single shared test data source).
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
Write-Host "TestData populated at: $saRoot/TestData"
Write-Host "Set TESTS_DIR=$saRoot/TestData in your environment (see start_vscode.bat)."
