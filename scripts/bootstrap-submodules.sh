#!/usr/bin/env bash
# Init all submodules recursively, then deinit the nested TestData/ working trees.
# Only SA/SankeyData/ remains populated (the single shared test+content data source).
set -euo pipefail

SA_ROOT="$(git rev-parse --show-toplevel)"
cd "$SA_ROOT"

git submodule update --init --recursive

# Parents of nested TestData submodules — deinit must run from each parent.
NESTED_PARENTS=(
  "submodules/MFAProblem"
  "packages/opensankey/submodules/SankeyExcelParser"
)

for parent in "${NESTED_PARENTS[@]}"; do
  if [ -d "$parent/TestData" ]; then
    git -C "$parent" submodule deinit -f TestData || true
  fi
done

echo ""
echo "SankeyData populated at: $SA_ROOT/SankeyData"
echo "Set TESTS_DIR=$SA_ROOT/SankeyData/tests in your environment (see start_vscode.bat)."
