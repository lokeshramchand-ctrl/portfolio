---
title: "A Secret-Redaction Fix That Redacted the Secret Out of Existence"
date: "Oct 20, 2026"
excerpt: "The KubeVirt cloud runner in cncf/automation hid its JIT config so well that the runner never received it. I made it substitute the value again and still keep it out of the logs."
tags: ["Go", "CNCF", "KubeVirt", "CI/CD", "Security", "Open Source"]
---

Two days after my fix for the OCI runner leaking its JIT config into logs, I fixed the KubeVirt provider, which had the opposite problem: it protected the secret so well that the runner never got it. My fix is [cncf/automation#769](https://github.com/cncf/automation/pull/769), fixing [#768](https://github.com/cncf/automation/issues/768), and it's merged.

## The bug

`run` in `ci/cloudrunners/kubevirt/main.go` treats any command containing `ACTIONS_RUNNER_INPUT_JITCONFIG` as sensitive. For sensitive commands, it skipped the `strings.ReplaceAll` that fills in the real value.

Only one command matches: the final `run.sh --jitconfig "${ACTIONS_RUNNER_INPUT_JITCONFIG}"`. So the VM got the literal placeholder text. SSH sessions don't forward the environment, so the remote shell expanded the variable to an empty string, and the runner started with:

```bash
run.sh --jitconfig ""
```

It never registered with GitHub.

## Where it came from

The guard was added in commit 9b361771 ("prevent secret exposure"). The intent was good: keep the JIT config out of the logs. But it redacted by not substituting at all. It hid the value from the machine that needed it, not just from the logs.

## The fix

I separated the two concerns:

- always expand the placeholder, so the VM gets the real value
- keep the `sensitive` flag, but only use it to keep the command's output out of the logs, which is what 9b361771 meant to do

I also pulled the substitution into its own function, `expandCommand`, so I could unit test it without a cluster. The `oci` and `gcp` providers already always substitute, so they didn't need changes.

## Testing

I added `TestExpandCommand` in `main_test.go`. It covers placeholder substitution together with the sensitive flag, and checks that a plain command comes through untouched. In `ci/cloudrunners`, `go build ./...`, `go vet ./...` and `go test ./...` passed, and so did the repo's `.github/scripts/check-go-version.sh` (Go 1.27.1).

I didn't have a live KubeVirt cluster to test against, so I wrote that down in the PR instead of implying I had.

## What I took away

These two PRs are mirror images. OCI showed the secret to too many people, and KubeVirt hid it from the one place that needed it. Both came from mixing up "what the program uses" and "what gets logged." Once I treated those as two separate decisions, both fixes were small.
