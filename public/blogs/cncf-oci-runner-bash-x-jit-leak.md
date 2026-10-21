---
title: "One Flag Was Printing a Runner Secret Into CI Logs"
date: "Oct 18, 2026"
excerpt: "The OCI cloud runner in cncf/automation ran its start script with bash -x, which traced the GitHub Actions JIT config into the logs. Removing one flag fixed it."
tags: ["Go", "CNCF", "CI/CD", "Security", "Open Source"]
---

This is one of the smallest fixes I've shipped: one line, one flag. It still matters a lot to me, because it stopped a secret from ending up in logs. It's [cncf/automation#763](https://github.com/cncf/automation/pull/763), fixing [#762](https://github.com/cncf/automation/issues/762), and it's merged.

## What I found

CNCF's `cncf/automation` repo has "cloudrunners" that spin up machines on different clouds to act as GitHub Actions runners. Each one gets a JIT (just-in-time) config, a one-shot credential the runner uses to register itself with GitHub.

In `ci/cloudrunners/oci/main.go`, `runOnMachine` started the runner like this:

```bash
bash -x /home/ubuntu/run.sh --jitconfig "${ACTIONS_RUNNER_INPUT_JITCONFIG}"
```

`-x` tells bash to trace every command with its arguments expanded before running it. So the remote shell printed the line again with the real JIT config filled in.

That alone wouldn't matter if nobody read the output. But `RunCommand` uses `CombinedOutput`, which captures stdout and stderr together, and the output was logged on both success and failure. So the trace, secret included, went straight into the logs.

## How I knew it was safe to remove

I looked at the sibling providers before touching anything. The kubevirt provider had already dropped `-x` for this exact reason in commit 9b361771 ("prevent secret exposure"), and `gcp/main.go` never used `-x` at all. OCI was the one provider that never got the fix.

So the change is:

```diff
- bash -x /home/ubuntu/run.sh --jitconfig "${ACTIONS_RUNNER_INPUT_JITCONFIG}"
+ bash /home/ubuntu/run.sh --jitconfig "${ACTIONS_RUNNER_INPUT_JITCONFIG}"
```

The only behavior change is that the trace is gone.

## Being honest about testing

I didn't run this against a real OCI runner, and I said so in the PR. For a one-line change that only removes a debug trace, I thought reading the code path carefully was the right level of verification. I followed the command string into `RunCommand`, confirmed `CombinedOutput` was being logged, and compared against the other two providers.

## What stuck with me

`bash -x` is a great debugging tool and a terrible thing to leave in production, especially on a command that takes a credential as an argument. Whenever a secret is passed on a command line, there are two things to check: who can see the command, and who can see its output. This bug was the second one.

Two days later I fixed a related bug in the kubevirt provider, where the "prevent secret exposure" change had gone too far in the other direction. That's the next post.
