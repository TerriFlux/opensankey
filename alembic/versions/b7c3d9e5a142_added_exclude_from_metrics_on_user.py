"""Added exclude_from_metrics column on user

Revision ID: b7c3d9e5a142
Revises: e1a2b3c4d5f6
Create Date: 2026-07-12 00:00:00.000000

Issue #256 — visites internes exclues du décompte de fréquentation. Un compte
portant ce flag (ou `is_developer`, exclu d'office) n'incrémente plus la table
`metrics` quand il charge la page d'accueil.

Pour marquer les comptes de l'équipe après migration :

    UPDATE user SET exclude_from_metrics = 1
    WHERE email IN ('...', '...');
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7c3d9e5a142'
down_revision = 'e1a2b3c4d5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('user') as batch_op:
        batch_op.add_column(sa.Column('exclude_from_metrics', sa.Boolean(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('user') as batch_op:
        batch_op.drop_column('exclude_from_metrics')
