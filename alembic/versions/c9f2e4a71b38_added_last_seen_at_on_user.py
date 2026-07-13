"""Added last_seen_at column on user

Revision ID: c9f2e4a71b38
Revises: b7c3d9e5a142
Create Date: 2026-07-12 00:00:00.000000

Issue #257 — trace d'activité des comptes, PRÉREQUIS à toute purge des comptes
inactifs. Le modèle ne portait que `creation` : impossible de distinguer un
compte créé il y a trois ans et utilisé hier d'un compte abandonné.

`last_seen_at` est alimentée au login ET sur toute requête authentifiée
(cf. models.touch_last_seen), au plus une écriture par jour et par utilisateur.

NULL = compte antérieur à l'instrumentation, jamais revu depuis. La commande de
purge (scripts/purge_inactive_accounts.py) est en DRY-RUN : elle n'efface rien.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9f2e4a71b38'
down_revision = 'b7c3d9e5a142'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('user') as batch_op:
        batch_op.add_column(sa.Column('last_seen_at', sa.String(length=128), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('user') as batch_op:
        batch_op.drop_column('last_seen_at')
