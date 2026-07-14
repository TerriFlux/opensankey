#!/usr/bin/env bash
# regenerate_testdata_refs.sh — Regenere les references *.json dans <SA>/SankeyData/tests
# pour les 3 suites de tests d'integration qui en dependent : SEP, MFA, OS.
#
# Usage : scripts/regenerate_testdata_refs.sh [SA_ROOT]
#
# Workflow attendu :
#   1. Ajouter ton .xlsx dans <SA>/SankeyData/tests/<MonDossier>/
#   2. scripts/regenerate_testdata_refs.sh
#   3. cd <SA>/SankeyData && git diff   (inspecte le diff souhaite)
#   4. cd <SA>/SankeyData && git add . && git commit -m "test: ..."
#      -> le hook post-commit (si installe) propose la cascade bump+push.
#
# Prerequis :
#   - SEP, MFA, OpenSankey installes editable dans l'env Python courant
#     (verif : `python -c "import SankeyExcelParser, mfa_problem"`)
#   - Submodule SankeyData initialise dans SA (`git submodule update --init SankeyData`)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SA_ROOT="${1:-$(cd "$SCRIPT_DIR/.." && pwd)}"

TD="$SA_ROOT/SankeyData"
[ -d "$TD" ] || { echo "ERR: $TD introuvable" >&2; exit 1; }

SEP="$SA_ROOT/packages/opensankey/submodules/SankeyExcelParser"
OS="$SA_ROOT/packages/opensankey"
MFA="$SA_ROOT/submodules/MFAProblem"

export TESTS_DIR="$TD/tests"

echo "================================================================"
echo " regenerate_testdata_refs.sh"
echo "----------------------------------------------------------------"
echo " SA root     : $SA_ROOT"
echo " TESTS_DIR   : $TESTS_DIR"
echo "================================================================"
echo

# Verification env Python
python -c "import SankeyExcelParser, mfa_problem" 2>/dev/null || {
  echo "ERR: SankeyExcelParser et/ou mfa_problem introuvables dans l'env Python." >&2
  echo "     Active l'env conda dev et verifie que les editables pointent sur SA." >&2
  exit 1
}

run_step() {
  local label="$1" repo="$2" rel_test="$3"
  # rel_test = chemin .py relatif au repo. On lance via `python -m` pour que
  # les imports relatifs (`from .test_mfa_problem import ...`) resolvent.
  local mod="${rel_test%.py}"
  mod="${mod//\//.}"
  echo "==> [$label] python -m $mod --generate_results"
  ( cd "$repo" && python -m "$mod" --generate_results )
  echo
}

run_step "SEP" "$SEP" "tests/integration/test_run_check_input.py"
run_step "SEP" "$SEP" "tests/integration/test_run_load_input.py"
run_step "MFA" "$MFA" "tests/integration/test_run_reconciliation.py"
run_step "OS"  "$OS"  "opensankey/tests/test_dict_results.py"

echo "================================================================"
echo " Done. Inspecte les changements :"
echo "   cd $TD && git status && git diff"
echo "================================================================"
