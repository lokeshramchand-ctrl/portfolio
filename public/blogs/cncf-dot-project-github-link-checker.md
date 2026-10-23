---
title: "Teaching a Link Checker That Not Every GitHub URL Is a Repo"
date: "Oct 20, 2026"
excerpt: "cncf/automation's link checker marked valid GitHub pages like /sponsors and /topics as broken. I made it double-check against github.com before reporting a 404."
tags: ["Go", "CNCF", "Testing", "Open Source"]
---

This is my third PR to `cncf/automation`, and the first one that isn't about CI runners. It's [cncf/automation#771](https://github.com/cncf/automation/pull/771), fixing [#770](https://github.com/cncf/automation/issues/770). It's still open.

## The bug

The `dot-project` utility checks links in project metadata. Its `checkGitHub` function assumed every github.com URL was a user, organization or repository. It called the REST API, and if that returned 404, it reported the link as broken.

Only `blob` and `tree` links got a second check against the website. Everything else was judged by the API alone. So perfectly valid pages that aren't users, orgs or repos were reported broken:

- `/sponsors/<user>`
- `/apps/<app>`
- `/topics/<topic>`
- `/marketplace/...`
- `/enterprises/<name>`

## The fix

Now any API 404 gets confirmed against github.com before the link is reported broken. Missing users, repos and files also return 404 on the web, so they still fail. The change is +24/-7.

Fixing it showed me a weakness in a test. The bootstrap test's mock server answered 200 for every github.com page, so once the checker started asking the website, the made-up maintainer `ghost` suddenly looked real. I changed the mock to return 404 for it on the web too, the way github.com does.

## Trade-offs I wrote down

- Links to nonexistent releases, wiki pages and discussions still pass if the repo exists. That's documented behavior and I didn't change it.
- A GitHub route name used as a maintainer handle, like `pricing`, would now pass, because github.com serves a page there. GitHub doesn't allow registering those names as accounts, so real handles aren't affected.

I'd rather list these in the PR than have a reviewer find them.

## How I tested it

I added cases to `TestLinkCheckerGitHubMapping` for `/sponsors`, `/apps`, `/topics`, `/marketplace` and `/enterprises`, plus one page that's missing on the web too and should stay broken. The new cases fail on the old code.

Then I ran 41 URLs against live GitHub through the real `LinkChecker`. Before the change, 30 were reported broken. After, 5. Three of those are genuinely missing targets, one is `github.com/issues` (which returns 404 to logged-out visitors), and one is a bogus path. Nonexistent user handles are still caught.

`go build`, `go vet` and `go test` pass in `utilities/dot-project`, except one validator test that fails on Windows only. It also fails on an untouched `main`, so it isn't mine. I haven't run the full GitHub Actions workflow.

## What I learned

Going from 30 false alarms to 5 is the number I care about. A link checker that cries wolf gets ignored, and then it misses the real broken links too.
