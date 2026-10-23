---
title: "Deleting One Environment Shouldn't Delete a Shared API Key"
date: "Aug 9, 2026"
excerpt: "A Postgres trigger in Nango hard-deleted an API key whenever any of its environments was removed, even if the key still belonged to others. I made it relation-aware."
tags: ["PostgreSQL", "TypeScript", "Nango", "Databases", "Open Source"]
---

This is a bug that can't happen yet. I wanted to fix it before it could. It's [NangoHQ/nango#7062](https://github.com/NangoHQ/nango/pull/7062), fixing [#7061](https://github.com/NangoHQ/nango/issues/7061), and it's still open.

## The trigger

`cleanup_customer_key_relations()` runs `BEFORE DELETE ON _nango_environments`. It was added in the migration that created customer keys. When an environment is removed, it finds any `customer_keys` related to it and hard-deletes them.

The problem is the word "any." It never checked whether the key was also related to a different environment that's still there. Because `customer_keys_relations.customer_key_id` uses `ON DELETE CASCADE`, deleting the key also wiped out its relations to every other environment. There was no soft-delete and no audit trail.

## When it would show up

The trigger runs from `EnvironmentService.hardDelete()`. That gets called by `deleteEnvironmentData()`, which the `deleteOldData` cron schedules once a soft-deleted environment's retention period runs out. So a key would lose access days or weeks after someone deleted an unrelated environment. That's a hard outage to trace back to its cause.

## Why fix something that can't happen yet

Right now no endpoint attaches one key to more than one environment. But the rest of the system already expects that to happen:

- `customer_keys_relations` has `UNIQUE (customer_key_id, entity_type, entity_id)`, which allows many environments per key
- `ApiKeyPrincipal.environmentIds` is a `number[]`
- `getApiKeyContextByCustomerKey` aggregates `environment_ids`

The description of #6991 even claims to add "relation-aware cleanup for shared environment keys," which this trigger didn't do. Whichever PR ships the first multi-environment endpoint (#7007, for example) would have triggered it.

## The fix

A new migration redefines the function. Now it only removes the relation row being deleted, and hard-deletes the key only if that was its last relation.

I checked whether a single `WITH ... DELETE ... RETURNING` statement could do it. It can't: in Postgres, data-modifying CTEs don't see each other's writes within the same statement, so a `NOT EXISTS` check would still see the relation I'd just deleted. It needs two separate `DELETE`s.

## Testing against real Postgres

I added an integration test that runs the real migrations against Postgres in testcontainers:

- a key related to two environments survives deleting one of them, and keeps only the surviving relation
- a key related to one environment is still deleted when that environment goes, so the original behavior is kept

I also confirmed the first test fails without the migration. `tsc`, `oxlint` and `prettier` were clean on the changed files.

## What I took from it

When I read a cleanup trigger, I ask whether it deletes the thing or just one link to it. Cascades make it easy to delete a lot more than you meant to.
