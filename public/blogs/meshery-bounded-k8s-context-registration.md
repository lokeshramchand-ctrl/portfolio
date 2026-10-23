---
title: "One Kubeconfig, Unlimited Goroutines: Bounding Meshery's Context Registration"
date: "Aug 25, 2026"
excerpt: "Meshery spawned one unbounded goroutine per Kubernetes context in an uploaded kubeconfig. I capped it with a semaphore so one request can't exhaust the server."
tags: ["Go", "Meshery", "Kubernetes", "Concurrency", "Security", "Open Source"]
---

My second Meshery PR came two days after the `pageSize` fix. It's [meshery/meshery#21611](https://github.com/meshery/meshery/pull/21611), fixing [#21610](https://github.com/meshery/meshery/issues/21610), and it's still open.

## The bug

`RegisterComponents` in `server/models/k8s_components_registration.go` started one goroutine for every Kubernetes context it was given. There was no worker pool, no semaphore and no limit.

Those contexts come from a kubeconfig the user uploads (`K8sContextsFromKubeconfig`). A `contexts:` entry doesn't have to point at a real or reachable cluster to be parsed and passed along.

So a single authenticated user, not even an admin, could `POST` a kubeconfig full of made-up contexts to `/api/system/kubernetes/register`. That causes a spike in goroutines, file descriptors and outbound connections, and the size of the spike is set by whoever sends the request. That's a resource-exhaustion DoS.

## It had been reported before

While checking for duplicates, I found [#8885](https://github.com/meshery/meshery/issues/8885) from 2023 describing a similar failure. The stale bot closed it without a code fix, and the code path hasn't changed since. That told me it was real and that nobody else was working on it.

## The fix

I added a constant and a buffered-channel semaphore around the goroutine spawn:

```go
const maxConcurrentK8sRegistrations = 10
```

Now there are never more than 10 registrations running at once, no matter how many contexts one request contains. The worst case went from "whatever the attacker sends" to a fixed number.

The final diff is +344/-32. Registration also respects caller cancellation and returns promptly when capacity isn't available, and there are more tests for shared workloads and large registration sets.

## Proving the cap holds

`TestRegisterComponentsBoundsConcurrency` registers 50 synthetic contexts and tracks the highest number running at the same time. It asserts that number never goes above the cap.

A concurrency test that always passes might not be measuring anything, so I checked it against a stricter bound to confirm it actually fails when the limit is exceeded. It passes under `-race`, and `gofmt -l` is clean. The full `server/models` suite passes, apart from some fixture failures that come from my sparse checkout and aren't related to this change. I couldn't run `make golangci` locally, so I said in the PR that CI would cover it.

## What I took from it

The pattern I'd watch for is "one goroutine per item," where the items come from user input. A for loop with `go func()` inside looks harmless until you ask who decides how many times it runs. When the answer is "the request," you need a limit, and a buffered channel is enough of one.
