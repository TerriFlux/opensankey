..
   Template for a developer-facing feature page.
   Copy this file under doc/sources/<lang>/dev/features/ and replace all
   the placeholders marked with TODO.

TODO: Feature title — technical description
==============================================

Goal
----

TODO: the problem the feature solves, in one paragraph. Prefer the
*why* over the *what* — the what is already visible in the user doc.

Data model
----------

TODO: new types, classes, fields, JSON shapes. Reference the files where
they live.

Runtime behavior
----------------

TODO: walk through the main code path — from the trigger (menu click,
event, hook) to the effect on the rendered output. Mention the hook
points in the draw lifecycle.

Rendering / visibility rules
----------------------------

TODO: if the feature changes how nodes or links are drawn or filtered,
document the exact rules (tables work well here).

Persistence
-----------

TODO: what is serialized into the saved JSON, and how it is restored on
load. Include legacy compatibility notes if relevant.

Files touched
-------------

=============================================  ============================
File                                           Main change
=============================================  ============================
``path/to/file.tsx``                           TODO: what changed
=============================================  ============================

Decisions and rejected alternatives
-----------------------------------

TODO: the non-obvious calls. Record the alternative that was considered
and why it was rejected — future maintainers will thank you when the
feature grows.

Known edge cases
----------------

TODO: what we know is not fully handled, so the next developer does not
have to rediscover it.

Possible evolutions
-------------------

TODO: follow-ups this PR deliberately did not address.

See also
--------

- :doc:`/user/features/TODO-slug` — user documentation
