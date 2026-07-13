"""Added usage_events table

Revision ID: a4f2c81be309
Revises: f1a7c3e90d24
Create Date: 2026-07-13 00:00:00.000000

Journal des actions métier (import, résolution MFA, publication, extraction
vision) : mesure l'usage RÉEL de l'outil, là où `metrics` ne mesure que le
trafic. Un robot charge des pages mais ne lance pas de solveur : cette table
est donc propre par construction, sans filtre d'User-Agent.

Complémentaire — et non redondante — avec `user.last_seen_at` / `last_login`
(#257, #270) : ces colonnes disent qu'un compte s'est CONNECTÉ, cette table dit
qu'il a FAIT quelque chose. Un compte qui ouvre l'app chaque semaine sans jamais
rien importer est « actif » au sens de last_seen_at, et pourtant il n'utilise pas
le produit. Les segments de campagne peuvent s'en servir pour viser juste.

`user_id` est nullable : donnée nominative quand elle est présente. La relance et
le droit d'opposition (`user.mail_optout`) sont gérés par le moteur de campagnes
(#270-#272) — rien n'est dupliqué ici.

`visitor_hash` est un HMAC clé (cf. models.hash_visitor_ip) et non un SHA-256 nu :
un hash d'IP non salé se casse par force brute (4 milliards d'IPv4).
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a4f2c81be309'
down_revision = 'f1a7c3e90d24'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'usage_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ts', sa.Integer(), nullable=False),
        sa.Column('event', sa.String(length=48), nullable=False),
        sa.Column('visitor_hash', sa.String(length=64), nullable=False),
        # Pas de ForeignKey : la suppression d'un compte ne doit pas faire
        # échouer l'insertion d'une métrique (best-effort par conception).
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('authenticated', sa.Boolean(), nullable=False),
        sa.Column('detail', sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_usage_events_ts', 'usage_events', ['ts'])
    op.create_index('ix_usage_events_event', 'usage_events', ['event'])
    op.create_index('ix_usage_events_visitor_hash', 'usage_events', ['visitor_hash'])
    op.create_index('ix_usage_events_user_id', 'usage_events', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_usage_events_user_id', table_name='usage_events')
    op.drop_index('ix_usage_events_visitor_hash', table_name='usage_events')
    op.drop_index('ix_usage_events_event', table_name='usage_events')
    op.drop_index('ix_usage_events_ts', table_name='usage_events')
    op.drop_table('usage_events')
