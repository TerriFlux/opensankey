"""
==================================================================================================
The MIT License (MIT)
==================================================================================================
Copyright (c) 2026 TerriFlux
==================================================================================================

Lecteur minimal du format de sérialisation .NET « BinaryFormatter », spécifié par
[MS-NRBF] (https://learn.microsoft.com/openspecs/windows_protocols/ms-nrbf/).

Il n'existe que pour une raison : le champ `Diagram.Document` d'un fichier STAN est
un graphe d'objets .NET sérialisé du composant propriétaire `NDiagram.DiagramCore`,
et c'est le seul endroit du fichier où sont écrites les positions des processus et
le tracé des flux. Sans ce lecteur, l'import STAN doit recalculer une mise en page
et perd le dessin de l'utilisateur.

On n'implémente que les enregistrements réellement rencontrés dans ces fichiers.
Tout enregistrement inconnu lève une exception plutôt que d'avancer le curseur à
l'aveugle : un décalage d'un seul octet fait dérailler la lecture bien plus loin,
de façon silencieuse et incompréhensible.

Deux pièges, tous deux payés au prix fort et donc signalés ici :

1. Dans `PrimitiveTypeEnumeration` ([MS-NRBF] 2.1.2.3) la valeur 4 est INUTILISÉE.
   `Decimal` vaut 5 et `Int32` vaut 8 — pas 7. Décaler d'un cran fait lire huit
   octets là où il en faut quatre.

2. `Diagram.Document` ne contient pas UN flux mais PLUSIEURS, concaténés : le
   document courant, puis la pile d'annulation. Les identifiants d'objets sont
   uniques par flux, donc les fusionner fait s'écraser des objets sans rapport.
   `read_streams` renvoie une table d'objets par flux.
"""

# coding: utf-8

import struct


# --- RecordTypeEnumeration [MS-NRBF] 2.1.2.1 ------------------------------------

SERIALIZED_STREAM_HEADER = 0
CLASS_WITH_ID = 1
SYSTEM_CLASS_WITH_MEMBERS = 2
CLASS_WITH_MEMBERS = 3
SYSTEM_CLASS_WITH_MEMBERS_AND_TYPES = 4
CLASS_WITH_MEMBERS_AND_TYPES = 5
BINARY_OBJECT_STRING = 6
BINARY_ARRAY = 7
MEMBER_PRIMITIVE_TYPED = 8
MEMBER_REFERENCE = 9
OBJECT_NULL = 10
MESSAGE_END = 11
BINARY_LIBRARY = 12
OBJECT_NULL_MULTIPLE_256 = 13
OBJECT_NULL_MULTIPLE = 14
ARRAY_SINGLE_PRIMITIVE = 15
ARRAY_SINGLE_OBJECT = 16
ARRAY_SINGLE_STRING = 17

# --- BinaryTypeEnumeration [MS-NRBF] 2.1.2.2 ------------------------------------

BT_PRIMITIVE = 0
BT_STRING = 1
BT_OBJECT = 2
BT_SYSTEM_CLASS = 3
BT_CLASS = 4
BT_OBJECT_ARRAY = 5
BT_STRING_ARRAY = 6
BT_PRIMITIVE_ARRAY = 7

# --- PrimitiveTypeEnumeration [MS-NRBF] 2.1.2.3 ---------------------------------
# La valeur 4 est inutilisée : ne pas « compacter » cette table.

PRIM_CHAR = 3
PRIM_DECIMAL = 5
PRIM_STRING = 18

PRIMITIVES = {
    1: ("?", 1),    # Boolean
    2: ("B", 1),    # Byte
    3: (None, 0),   # Char (UTF-8, longueur variable)
    5: (None, 0),   # Decimal (chaîne préfixée)
    6: ("<d", 8),   # Double
    7: ("<h", 2),   # Int16
    8: ("<i", 4),   # Int32
    9: ("<q", 8),   # Int64
    10: ("<b", 1),  # SByte
    11: ("<f", 4),  # Single
    12: ("<q", 8),  # TimeSpan
    13: ("<q", 8),  # DateTime
    14: ("<H", 2),  # UInt16
    15: ("<I", 4),  # UInt32
    16: ("<Q", 8),  # UInt64
    18: (None, 0),  # String
}


class NrbfError(ValueError):
    """Lecture impossible : enregistrement inconnu, ou flux tronqué."""


class ClassRef(object):
    """Un objet du graphe : son nom de classe et ses membres nommés."""

    def __init__(self, object_id, name):
        self.object_id = object_id
        self.name = name
        self.members = {}

    def __repr__(self):
        return "<%s#%s>" % (self.name, self.object_id)


class Ref(object):
    """Référence différée vers un objet du même flux."""

    def __init__(self, object_id):
        self.object_id = object_id

    def __repr__(self):
        return "<Ref %d>" % self.object_id


class _EndOfStream(Exception):
    pass


class _Reader(object):

    def __init__(self, data):
        self.d = data
        self.p = 0
        self.objects = {}
        self.class_meta = {}

    # --- lecture élémentaire ---

    def u8(self):
        v = self.d[self.p]
        self.p += 1
        return v if isinstance(v, int) else ord(v)

    def i32(self):
        v = struct.unpack_from("<i", self.d, self.p)[0]
        self.p += 4
        return v

    def string(self):
        """LengthPrefixedString : longueur encodée sur 7 bits par octet."""
        length, shift = 0, 0
        while True:
            b = self.u8()
            length |= (b & 0x7F) << shift
            if not b & 0x80:
                break
            shift += 7
        s = self.d[self.p:self.p + length].decode("utf-8", "replace")
        self.p += length
        return s

    def prim(self, ptype):
        if ptype in (PRIM_STRING, PRIM_DECIMAL):
            return self.string()
        if ptype == PRIM_CHAR:
            for n in (1, 2, 3, 4):
                try:
                    c = self.d[self.p:self.p + n].decode("utf-8")
                    self.p += n
                    return c
                except UnicodeDecodeError:
                    continue
            raise NrbfError("caractère invalide à l'offset %d" % self.p)
        if ptype not in PRIMITIVES:
            raise NrbfError("type primitif inconnu %d à l'offset %d" % (ptype, self.p))
        fmt, size = PRIMITIVES[ptype]
        v = struct.unpack_from(fmt, self.d, self.p)[0]
        self.p += size
        return v

    # --- structures ---

    def _class_info(self):
        object_id = self.i32()
        name = self.string()
        count = self.i32()
        return object_id, name, [self.string() for _ in range(count)]

    def _member_type_info(self, count):
        types = [self.u8() for _ in range(count)]
        extras = []
        for t in types:
            if t in (BT_PRIMITIVE, BT_PRIMITIVE_ARRAY):
                extras.append(self.u8())
            elif t == BT_SYSTEM_CLASS:
                extras.append(self.string())
            elif t == BT_CLASS:
                extras.append((self.string(), self.i32()))
            else:
                extras.append(None)
        return types, extras

    def _read_members(self, obj, names, types, extras):
        for name, t, e in zip(names, types, extras):
            obj.members[name] = self.prim(e) if t == BT_PRIMITIVE else self.record()

    def _read_n(self, n):
        """Lit n valeurs, en développant les enregistrements « n nuls d'affilée »."""
        out = []
        while len(out) < n:
            v = self.record()
            if isinstance(v, _NullRun):
                out.extend([None] * v.count)
            else:
                out.append(v)
        return out[:n]

    # --- enregistrements ---

    def record(self):
        rt = self.u8()

        if rt == BINARY_LIBRARY:
            self.i32()
            self.string()
            return self.record()

        if rt in (CLASS_WITH_MEMBERS_AND_TYPES, SYSTEM_CLASS_WITH_MEMBERS_AND_TYPES):
            object_id, name, names = self._class_info()
            types, extras = self._member_type_info(len(names))
            if rt == CLASS_WITH_MEMBERS_AND_TYPES:
                self.i32()  # LibraryId
            obj = ClassRef(object_id, name)
            self.objects[object_id] = obj
            self.class_meta[object_id] = (name, names, types, extras)
            self._read_members(obj, names, types, extras)
            return obj

        if rt == CLASS_WITH_ID:
            object_id = self.i32()
            metadata_id = self.i32()
            if metadata_id not in self.class_meta:
                raise NrbfError("classe %d inconnue à l'offset %d" % (metadata_id, self.p))
            name, names, types, extras = self.class_meta[metadata_id]
            obj = ClassRef(object_id, name)
            self.objects[object_id] = obj
            self._read_members(obj, names, types, extras)
            return obj

        if rt == BINARY_OBJECT_STRING:
            object_id = self.i32()
            s = self.string()
            self.objects[object_id] = s
            return s

        if rt == MEMBER_REFERENCE:
            return Ref(self.i32())

        if rt == OBJECT_NULL:
            return None

        if rt == OBJECT_NULL_MULTIPLE_256:
            return _NullRun(self.u8())

        if rt == OBJECT_NULL_MULTIPLE:
            return _NullRun(self.i32())

        if rt == MEMBER_PRIMITIVE_TYPED:
            return self.prim(self.u8())

        if rt == ARRAY_SINGLE_PRIMITIVE:
            object_id = self.i32()
            length = self.i32()
            ptype = self.u8()
            vals = [self.prim(ptype) for _ in range(length)]
            self.objects[object_id] = vals
            return vals

        if rt in (ARRAY_SINGLE_OBJECT, ARRAY_SINGLE_STRING):
            object_id = self.i32()
            length = self.i32()
            vals = self._read_n(length)
            self.objects[object_id] = vals
            return vals

        if rt == BINARY_ARRAY:
            object_id = self.i32()
            array_type = self.u8()
            rank = self.i32()
            lengths = [self.i32() for _ in range(rank)]
            if array_type in (3, 4, 5):  # variantes « avec offsets »
                [self.i32() for _ in range(rank)]
            t = self.u8()
            extra = None
            if t in (BT_PRIMITIVE, BT_PRIMITIVE_ARRAY):
                extra = self.u8()
            elif t == BT_SYSTEM_CLASS:
                extra = self.string()
            elif t == BT_CLASS:
                extra = (self.string(), self.i32())
            total = 1
            for n in lengths:
                total *= n
            if t == BT_PRIMITIVE:
                vals = [self.prim(extra) for _ in range(total)]
            else:
                vals = self._read_n(total)
            self.objects[object_id] = vals
            return vals

        if rt == MESSAGE_END:
            raise _EndOfStream

        raise NrbfError("enregistrement inconnu %d à l'offset %d" % (rt, self.p - 1))


class _NullRun(object):
    """Marqueur interne : « n objets nuls consécutifs »."""

    def __init__(self, count):
        self.count = count


def read_streams(data):
    """Lit tous les flux concaténés et renvoie une table d'objets par flux.

    Les identifiants d'objets étant uniques PAR FLUX, ces tables ne doivent pas
    être fusionnées. Utiliser `index_by_uid` pour retrouver un objet précis.
    """
    r = _Reader(data)
    streams = []
    while r.p < len(data):
        if r.d[r.p] != SERIALIZED_STREAM_HEADER:
            # Octet de remplissage entre deux flux.
            r.p += 1
            continue
        r.p += 1
        r.i32()  # RootId
        r.i32()  # HeaderId
        r.i32()  # MajorVersion
        r.i32()  # MinorVersion
        r.objects, r.class_meta = {}, {}
        try:
            while r.p < len(data) and r.d[r.p] != SERIALIZED_STREAM_HEADER:
                r.record()
        except _EndOfStream:
            pass
        streams.append(r.objects)
    return streams


def resolve(value, objects, _depth=0):
    """Déréférence une valeur dans la table d'objets de SON flux."""
    if _depth > 16:
        return None
    if isinstance(value, Ref):
        return resolve(objects.get(value.object_id), objects, _depth + 1)
    return value


def guid_of(obj, objects):
    """Rend le `System.Guid` d'un objet sous sa forme canonique, ou None."""
    g = resolve(obj.members.get("m_UID"), objects)
    if not (isinstance(g, ClassRef) and g.name == "System.Guid"):
        return None
    m = dict((k, resolve(v, objects)) for k, v in g.members.items())
    try:
        parts = [
            (m["_a"] & 0xFFFFFFFF).to_bytes(4, "big"),
            (m["_b"] & 0xFFFF).to_bytes(2, "big"),
            (m["_c"] & 0xFFFF).to_bytes(2, "big"),
            bytes((m[k] & 0xFF) for k in ("_d", "_e", "_f", "_g", "_h", "_i", "_j", "_k")),
        ]
    except KeyError:
        return None
    raw = b"".join(parts).hex()
    return "%s-%s-%s-%s-%s" % (raw[0:8], raw[8:12], raw[12:16], raw[16:20], raw[20:32])


def rect_of(value, objects):
    """Déplie un `m_Bounds` (NMVRectangle -> NGRectangle -> RectangleF) en (x, y, w, h)."""
    o = resolve(value, objects)
    for _ in range(4):
        if not isinstance(o, ClassRef):
            return None
        if "x" in o.members:
            return tuple(resolve(o.members[k], objects) for k in ("x", "y", "width", "height"))
        nxt = o.members.get("m_Model") or o.members.get("RectF")
        if nxt is None:
            return None
        o = resolve(nxt, objects)
    return None


def index_by_uid(streams):
    """Indexe tous les objets porteurs d'un `m_UID`, sur l'ensemble des flux.

    Un même GUID apparaît dans plusieurs flux (document + historique d'annulation) :
    on retient la première occurrence qui porte une géométrie exploitable.
    """
    index = {}
    for objects in streams:
        for obj in objects.values():
            if not isinstance(obj, ClassRef) or "m_UID" not in obj.members:
                continue
            uid = guid_of(obj, objects)
            if uid is None:
                continue
            bounds = rect_of(obj.members["m_Bounds"], objects) if "m_Bounds" in obj.members else None
            known = index.get(uid)
            if known is None or (known["bounds"] is None and bounds is not None):
                index[uid] = {
                    "class": obj.name.rsplit(".", 1)[-1],
                    "bounds": bounds,
                    "text": resolve(obj.members.get("m_sText"), objects),
                    "object": obj,
                    "objects": objects,
                }
    return index
