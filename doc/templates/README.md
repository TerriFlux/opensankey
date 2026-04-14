# Feature documentation templates

When you ship a feature, write two pages for it:

- a **user** page under `doc/sources/<lang>/user/features/`
- a **dev** page under `doc/sources/<lang>/dev/features/`

Write both in French **and** English. Copy the matching template and
replace the placeholders.

## Templates

- [`feature-user.rst`](feature-user.rst) — user-facing page
- [`feature-dev.rst`](feature-dev.rst) — developer page

## Conventions

- **Filename**: short, lowercase, language-appropriate
  (`mode_englobant.rst` in FR, `enclosing_mode.rst` in EN). Keep it stable
  across languages at the **section / position** level, not the filename,
  so each language reads naturally.
- **Cross-references**: link the user page to the dev page at the bottom
  via `:doc:` and vice versa.
- **Screenshots**: place them under `doc/sources/<lang>/_images/` or a
  shared `_images/` folder, and reference them with `.. image::`.
- **Code locations**: reference source files with
  ``file.tsx`` and a line number when it helps (e.g.
  ``Elements/Link.tsx`` line 1139) — prefer stable anchors (class /
  method names) over line numbers when possible, since lines drift.
- **Length**: user pages aim for ~1 screen, dev pages are as long as
  needed but keep the structure. A good dev page is one a future
  maintainer can read cold and understand both the code and the
  decisions behind it.

## Keeping user and dev docs in sync

The two audiences read different things:

- The **user page** answers: what does this do, when do I use it, how do
  I trigger it, what am I not getting?
- The **dev page** answers: where does this live in the codebase, how
  does it work, why was it built this way, what are the edge cases?

Do not duplicate the technical internals into the user page, and do not
hide the limitations in the dev page. Both pages should list user-visible
limitations.
