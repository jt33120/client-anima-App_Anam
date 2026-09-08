# Night and numerology verification

The screenshots use actual components and synthetic fixtures, with intercepted API requests. They do not prove production authentication.

Chromium and WebKit at 390, 768 and 1440 pixels verify: former paper preference ignored; no Paper control; life path then personal year; closed extra numbers; GET on mount; explicit POST; rating 4 excluded; rating 5 with separate sharing; withdrawal and lower-rating revocation; radio touch targets at least44px; no horizontal overflow or browser error; astrological reference points before the chart; no missing-data section; mobile daily-sky disclosure.

`results.json` records the browser checks. `provider-result.json` records one real provider completion with synthetic computed numbers, the locally available provider key and the model selected by production configuration. Raw name/date and generated personal information are not included in that evidence file.

The local SQL tests additionally cover account isolation, server-only generation, consent/source invalidation, export and deletion. `tests/probes/numerologie-baux.sql` runs transactionally and rolls back its synthetic rows; it verifies lease expiry, stale tokens and the daily cost bound.

Complete test pass:6525 successes with one transient local proxy failure; the affected RPC suite passed4/4 on replay without changes. Lint, TypeScript and build passed. Remote schema aligned through0099.
