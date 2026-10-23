---
title: "Setting Up an Open Source Repo So Contributors Know What to Do"
date: "Oct 21, 2026"
excerpt: "My PR to accesscraft adds issue forms, contribution policies and CI automation. None of it is code, and all of it decides whether people can contribute."
tags: ["GitHub Actions", "Open Source", "CI/CD", "Community"]
---

Most of my PRs fix bugs. This one doesn't touch a single line of application code. It's [accesscraft#2](https://github.com/blessinglinus698-coder/accesscraft/pull/2), closing [#1](https://github.com/blessinglinus698-coder/accesscraft/issues/1), and it's still open.

accesscraft is an accessibility scanner. The issue asked for the contribution setup an open source project needs. I've been on the contributor side of enough repos to know how much it helps when this is already in place, so I took it on.

## What I added

**Issue forms.** Bug report, feature request, documentation and two specific to this project: scan accuracy and accessibility barriers in accesscraft itself. An accessibility tool should have a direct way to report that the tool itself isn't accessible. There's also a PR template and an issue chooser config.

**Policies.** `CONTRIBUTING.md` (setup, Conventional Commits, DCO, review process), `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `CODEOWNERS`, and `SECURITY.md`. The security policy covers scanner-specific risks like SSRF. A scanner fetches URLs that users give it, so that's where I expect real reports to come from.

**Workflows.** CI, DCO enforcement, CodeQL, dependency review, PR title linting, auto-labeling, label sync, release drafter, a stale bot, and a welcome message for first-time contributors.

**Dependabot.** Weekly updates for the npm backend and frontend, Docker, and GitHub Actions.

In total it's 26 files, all new.

## What I couldn't test

I parsed every YAML file under `.github/` with a YAML loader, and they're all valid. But workflows only really run on GitHub, so this PR is their first real test. I said that plainly in the description instead of implying more.

## Notes for the maintainer

Some things a PR can't do, so I listed them:

- After merging, turn on branch protection with `CI success` and `DCO sign-off` as required checks, and enable Discussions and private vulnerability reporting.
- The code of conduct sends reports through private advisories for now. Add a contact address when there is one.
- The `npm audit` steps don't block builds yet, so existing advisories won't fail every build on day one. Tighten that later.

## Why I think this matters

The first thing a new contributor sees isn't the code. It's the issue form, the PR template and the first CI run on their PR. If those are missing, people have to guess, and many of them won't bother. This PR is my attempt to take that guessing away.
