---
title: "Owning the Stack: Building My Personal Cloud"
date: "July 20, 2026"
excerpt: "Why I built my own cloud on Proxmox, and what I learned getting a static IP, a reverse proxy, Keycloak and monitoring running at home."
tags: ["Architecture", "Self-Hosting", "Cloud"]
---

When people ask why I built my own cloud, my answer is that I got tired of being a passenger.

## Getting a static IP

Getting a static public IP from an ISP in India felt like dealing with bureaucracy. It wasn't impossible, but every support call made it sound like I was asking for something exotic. I wanted a direct connection without tunneling through proxies or depending on third parties, so I kept at it.

## Not starting with an old laptop

A lot of homelabs start with a dusty laptop. Mine didn't. I build web and mobile apps and I'm always experimenting with heavy infrastructure, so I knew I'd need a machine that wouldn't choke on databases or vector embeddings. I went with a dedicated desktop: an NVIDIA RTX 5060 and 16GB of RAM. It cost more upfront, and I've never regretted it.

## Proxmox and LXC

Full VMs felt bloated for what I wanted, and a desktop OS wasn't built for this. Proxmox fixed that. I run almost everything as LXC containers, which isolate services without the overhead of a full VM. With tools like Milvus, I notice the difference.

What sold me was setting hard CPU and memory limits per container. If one experiment goes haywire, the rest keep running.

## Making it reachable

I registered a domain and set up Nginx as a reverse proxy. There were plenty of broken configs and 2 AM routing errors along the way, but now every service has its own subdomain.

`.htpasswd` files felt clunky and didn't scale with how often I build new things, so I deployed Keycloak. I stopped writing login logic for every project. With OpenID Connect I get single sign-on across everything I run, both off-the-shelf tools and my own endpoints. It's basically my own Auth0, except I control it.

## Seeing what's going on

With lots of containers running, I didn't want to fly blind. Prometheus collects metrics and Grafana shows them: GPU, storage, memory spikes and network traffic. I don't have to guess anymore.

## What changed for me

For years, my job as a developer ended at the commit. I wrote Python backends and Dart apps, handed them to a cloud provider and assumed the rest would work. Running my own hardware ended that. Now I'm responsible for everything from the machine up to the app, and I understand how my code actually gets served.

I wrote a follow-up about how I organized my Nginx configs, if you want the details.
