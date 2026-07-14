"""Dédoublonne user_licenses et impose l'unicité du couple (user_id, license_id)

Revision ID: b8e3d17c45a2
Revises: a4f2c81be309
Create Date: 2026-07-13 00:00:00.000000

Un même utilisateur pouvait porter plusieurs lignes user_licenses pour la même
licence : les webhooks Stripe se retrouvent sur le stripe_id de l'abonnement, si
bien que deux abonnements successifs pour la même licence (essai puis achat, ou
ré-abonnement) créaient deux lignes du même couple.

Ce n'était pas qu'un doublon d'affichage. User.get_license() fait un .first() :
l'admin ne révoquait donc qu'une des lignes, pendant que has_valid_license(), qui
parcourt toutes les lignes, restait vrai grâce à l'autre. Révoquer ne révoquait
rien.

On replie chaque groupe sur une seule ligne — l'expiration la plus favorable
l'emporte, la licence reste activée si l'une des lignes l'était, le stripe_id le
plus récent est conservé — puis on rend l'invariant structurel. Les lignes
incomplètes (user_id ou license_id à NULL, le temps que le webhook manquant
arrive) ne sont pas concernées : NULL n'entre pas en collision dans une
contrainte d'unicité.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8e3d17c45a2'
down_revision = 'a4f2c81be309'
branch_labels = None
depends_on = None


def _expiry_rank(expiry):
    """Ordonne des expirations : 'never' > date la plus lointaine > None."""
    if expiry == "never":
        return (2, "")
    if expiry:
        return (1, expiry)
    return (0, "")


def upgrade() -> None:
    conn = op.get_bind()
    rows = conn.execute(sa.text(
        "SELECT id, user_id, license_id, creation, expiry, activated, stripe_id"
        " FROM user_licenses"
        " WHERE user_id IS NOT NULL AND license_id IS NOT NULL"
        " ORDER BY id"
    )).mappings().all()

    groups = {}
    for row in rows:
        groups.setdefault((row["user_id"], row["license_id"]), []).append(row)

    for dupes in groups.values():
        if len(dupes) < 2:
            continue
        # On garde la ligne la plus favorable, et à égalité la plus récente.
        keeper = max(dupes, key=lambda r: (_expiry_rank(r["expiry"]), bool(r["activated"]), r["id"]))
        activated = any(bool(r["activated"]) for r in dupes)
        creations = sorted(r["creation"] for r in dupes if r["creation"])
        creation = creations[0] if creations else None
        stripe_ids = [r["stripe_id"] for r in dupes if r["stripe_id"]]
        stripe_id = keeper["stripe_id"] or (stripe_ids[-1] if stripe_ids else None)

        # Supprimer d'abord : stripe_id est unique, l'identifiant repris ne peut
        # pas cohabiter avec la ligne qui le portait.
        for row in dupes:
            if row["id"] != keeper["id"]:
                conn.execute(
                    sa.text("DELETE FROM user_licenses WHERE id = :id"),
                    {"id": row["id"]},
                )
        conn.execute(
            sa.text(
                "UPDATE user_licenses"
                " SET expiry = :expiry, activated = :activated,"
                "     creation = :creation, stripe_id = :stripe_id"
                " WHERE id = :id"
            ),
            {
                "expiry": keeper["expiry"],
                "activated": activated,
                "creation": creation,
                "stripe_id": stripe_id,
                "id": keeper["id"],
            },
        )

    with op.batch_alter_table("user_licenses") as batch_op:
        batch_op.create_unique_constraint("uq_user_licenses_user_license", ["user_id", "license_id"])


def downgrade() -> None:
    # Les doublons supprimés ne sont pas restaurés : seule la contrainte tombe.
    with op.batch_alter_table("user_licenses") as batch_op:
        batch_op.drop_constraint("uq_user_licenses_user_license", type_="unique")
