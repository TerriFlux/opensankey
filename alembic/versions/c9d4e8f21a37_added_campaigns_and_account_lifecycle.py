"""Added campaign tables and account lifecycle columns on user

Revision ID: c9d4e8f21a37
Revises: b7c3d9e5a142
Create Date: 2026-07-13 00:00:00.000000

Issue #270 — campagnes de mail et nettoyage de la base de comptes.

Ajoute sur `user` de quoi suivre le cycle de vie d'un compte (dernière connexion,
refus de mail, désactivation avec purge différée) et deux tables pour les
campagnes (`campaign`, `campaign_recipient`).

Attention au ciblage : après cette migration, `last_login` est NULL pour TOUS les
comptes existants — la colonne n'existait pas avant, donc NULL veut dire « on ne
sait pas », pas « jamais connecté ». Ne cibler un segment sur `last_login` qu'une
fois qu'elle aura eu le temps de se remplir.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9d4e8f21a37'
down_revision = 'b7c3d9e5a142'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('user') as batch_op:
        batch_op.add_column(sa.Column('last_login', sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column('mail_optout', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('deactivated_at', sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column('purge_after', sa.String(length=128), nullable=True))

    op.create_table(
        'campaign',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=True),
        sa.Column('template', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=True),
        sa.Column('created_at', sa.String(length=128), nullable=True),
        sa.Column('created_by', sa.String(length=128), nullable=True),
        sa.Column('segment', sa.String(length=256), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'campaign_recipient',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('campaign_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('email', sa.String(length=128), nullable=True),
        sa.Column('token', sa.String(length=64), nullable=True),
        sa.Column('sent_at', sa.String(length=128), nullable=True),
        sa.Column('error', sa.String(length=256), nullable=True),
        sa.Column('clicked_at', sa.String(length=128), nullable=True),
        sa.Column('action', sa.String(length=16), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaign.id'], ondelete='CASCADE'),
        # SET NULL : la trace du contact survit à la purge du compte, pour ne pas
        # re-solliciter une adresse qui s'est désinscrite.
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
    )
    op.create_index('ix_campaign_recipient_token', 'campaign_recipient', ['token'])


def downgrade() -> None:
    op.drop_index('ix_campaign_recipient_token', table_name='campaign_recipient')
    op.drop_table('campaign_recipient')
    op.drop_table('campaign')
    with op.batch_alter_table('user') as batch_op:
        batch_op.drop_column('purge_after')
        batch_op.drop_column('deactivated_at')
        batch_op.drop_column('mail_optout')
        batch_op.drop_column('last_login')
