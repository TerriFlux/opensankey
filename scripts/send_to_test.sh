#! /bin/bash
# Déploie la version "test" en poussant la branche test
# (déclenche le job CI test_opensankey : rule CI_COMMIT_REF_NAME == "test").
# Ancien flux par tag 'test' supprimé : on ne travaille plus que sur la branche.

set -e

# Pousse le HEAD courant vers la branche test (fast-forward attendu ; échoue sinon -> à résoudre à la main).
git push origin HEAD:refs/heads/test

# Snapshot daté pour l'historique (conserve la convention test-v<date>).
TAG="test-v$(date '+%y.%m.%d')"
git tag "$TAG" 2>/dev/null && git push origin "refs/tags/$TAG" || echo "tag $TAG déjà présent, ignoré"
