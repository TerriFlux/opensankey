# SankeyApplication documentation sources

This folder hosts the Sphinx sources for the SankeyApplication documentation.

## Layout

```
sources/
├── fr/                 French Sphinx project
│   ├── conf.py
│   ├── index.rst
│   ├── user/           user-facing docs (features, guides)
│   └── dev/            developer docs (architecture, features internals)
├── en/                 English Sphinx project (mirror of fr/)
│   └── ...
├── index/              legacy, to archive or delete
├── pages/              legacy, to archive or delete
└── conf.py             legacy, to archive or delete
```

Two independent Sphinx projects (one per language) are used instead of
`sphinx-intl` / gettext. This keeps the initial setup simple and each
language's content fully editable as plain RST; we can migrate to gettext
later if translation maintenance becomes an issue.

## Build

From the repository root:

```
sphinx-build -b html doc/sources/fr doc/build/fr/html
sphinx-build -b html doc/sources/en doc/build/en/html
```

The Flask `doc/views.py` may need to be updated to serve the two language
subtrees — **not done yet**, flagged as a follow-up.

## Writing a new feature doc

Every new feature should land two pages — one for users, one for
developers — in both languages. Start from the templates in
[`../templates/`](../templates/README.md).

## Legacy content

The folders `index/`, `pages/` and the root `conf.py` inside `sources/`
are the previous (2023) documentation, kept in place until the new
structure is validated. They are **no longer referenced** by the new FR
and EN projects and can be archived or removed.
