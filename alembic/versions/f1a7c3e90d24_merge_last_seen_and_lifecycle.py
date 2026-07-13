"""Merge heads: last_seen_at (#257) + campaigns/account lifecycle (#270-#272)

Revision ID: f1a7c3e90d24
Revises: c9f2e4a71b38, c9d4e8f21a37
Create Date: 2026-07-12 00:00:00.000000

Deux migrations ont ete ecrites en parallele sur le meme parent
(`b7c3d9e5a142`), creant DEUX TETES :

  - c9f2e4a71b38 — last_seen_at (#257)
  - c9d4e8f21a37 — campagnes + cycle de vie des comptes (#270/#271/#272)

Avec deux tetes, `alembic upgrade head` echoue ("Multiple head revisions are
present") : le deploiement est bloque. Cette revision de FUSION rejoint les deux
branches et retablit une tete unique. Elle ne touche PAS au schema (les deux
migrations restent appliquees telles quelles).
"""

# revision identifiers, used by Alembic.
revision = 'f1a7c3e90d24'
down_revision = ('c9f2e4a71b38', 'c9d4e8f21a37')
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Fusion de graphe uniquement : aucun changement de schema."""
    pass


def downgrade() -> None:
    """Fusion de graphe uniquement : aucun changement de schema."""
    pass
