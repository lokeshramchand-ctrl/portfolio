---
title: "Owning the Stack: Building My Personal Cloud"
date: "July 20, 2026"
excerpt: "A journey into self-hosting and the lessons learned while building a personal cloud infrastructure."
tags: ["Architecture", "Self-Hosting", "Cloud"]
---

When people ask why I decided to build my own cloud, the honest answer is: I got tired of being a passenger.

## The Static IP Quest

Let me be real—getting a static public IP from an ISP in India felt like negotiating with bureaucracy itself. It wasn't impossible, but it definitely wasn't straightforward. Every conversation with support felt like I was asking for something exotic. But that direct connection to the internet? That was non-negotiable for me. I didn't want to tunnel through proxies or beg third parties for access. I wanted my own slice of the web.

## Why I Didn't Start in a Closet

You know the classic homelab origin story: someone dusts off an ancient laptop they've had for years and uses it as their first server. That wasn't me. I build web and mobile apps for a living, and I'm constantly tinkering with heavy infrastructure. I knew from day one that I'd need real horsepower—the kind that doesn't choke when you're running databases or experimenting with vector embeddings.

So I went straight for a proper setup: an NVIDIA RTX 5060, 16GB of RAM, and a dedicated desktop that actually meant business. Yeah, it was a bigger upfront investment, but having that kind of computing power sitting right there on my desk? It changed everything.

## The Proxmox "Aha" Moment

Choosing an operating system sounds simple until you realize it's really about choosing a *philosophy*. Running traditional VMs felt bloated for what I wanted to do. Desktop operating systems? Forget about it—they're not built for what I needed.

Then I discovered Proxmox, and things clicked. Instead of spinning up heavy VMs for every little project, I went all-in on LXC containers. The performance difference was immediately noticeable. When you're working with resource-hungry tools like Milvus or testing custom APIs, every bit of overhead matters. 

What really sold me was the control. With Proxmox, I can set hard boundaries on CPU and memory for each container. One experimental project going haywire doesn't bring down my entire infrastructure. Everything stays stable, predictable, and responsive.

## Making It Actually Accessible

Running apps on your own hardware is one thing. Actually *reaching* them without a security nightmare? That's a whole different challenge.

I registered my own domain and set up Nginx as a reverse proxy. Fair warning: there were some hilariously broken configurations along the way. Routing errors at 2 AM. Typos that took way too long to debug. But once I got it working, every service lived on its own isolated subdomain—clean, organized, professional.

But basic passwords and `.htpasswd` files felt... clunky. That approach doesn't scale when you're constantly building new things. So I deployed **Keycloak**.

Here's the thing: I didn't want to reinvent the wheel every time I built a new project. Keycloak let me stop writing custom login logic and start using proper, enterprise-grade authentication—basically, my own personal Auth0 that I actually control. With OpenID Connect (OIDC) wrapping around everything, I got true Single Sign-On. One login for everything in my ecosystem, whether it's off-the-shelf tools or my own custom endpoints.

## Seeing What's Actually Happening

When you're running multiple containers simultaneously, flying blind isn't an option. I set up Prometheus to gather metrics and built Grafana dashboards to visualize the real-time data.

Now I can actually *see* what my RTX 5060 is doing. Storage usage, memory spikes, network traffic—it's all there on my dashboard. No more guessing.

## The Bridge I Didn't Know I Was Missing

For years, my world as a developer ended at the code commit. I'd write Python backends and Dart apps and hand them off to cloud providers, assuming everything would "just work" on the other side. There was a comfort in that separation.

Building this infrastructure changed that in a way I didn't expect. I'm no longer just writing software and hoping for the best. I'm actually *responsible* for the hardware it runs on. I understand the entire journey now—from the silicon upward.

That's the real value I got out of this. Not just lower costs or more control, but a genuine understanding of what it means to build something that *lasts*.

---

*(I'm planning a deep dive into my Nginx configurations soon—stay tuned!)*