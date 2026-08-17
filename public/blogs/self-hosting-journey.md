---
title: "Owning the Stack: Building My Personal Cloud"
date: "July 24, 2026"
excerpt: "A journey into self-hosting and the lessons learned while building a personal cloud infrastructure."
tags: ["Architecture", "Self-Hosting", "Cloud"]
---

# Owning My Infrastructure: A Deep Dive into Self-Hosting

### The Public IP Hustle

If you've ever tried self-hosting in India, you know that getting a static public IP from an ISP isn't exactly a walk in the park. It took some negotiation, but securing that IP was step one. I didn't want to rely on third-party tunnels or workarounds—I wanted a direct, unadulterated connection to my own piece of the internet.

### Skipping the Laptop Phase

A lot of homelab stories start with an old, dusty laptop pulled from a closet. I skipped that phase. Because I build web and mobile applications and actively experiment with heavy backend systems, I knew I needed raw power for intensive workloads and dedicated databases right out of the gate. I went straight for a dedicated desktop rig packing an NVIDIA RTX 5060 and 16GB of RAM. It was an investment, but having that kind of compute sitting on my desk is a game-changer.

### The Proxmox Revelation

With the hardware ready, deciding on the OS wasn't just about what to run, but _why_ I needed it. Running standard VMs for every little app wastes precious compute, and basic desktop operating systems don't offer the deep hardware control I wanted.

I chose Proxmox because it lets me manage the bare metal natively and efficiently. By going all-in on LXC (Linux Containers), I cut out the heavy virtualization overhead entirely. This matters immensely when running intensive tools like vector databases (Milvus) or testing custom APIs. I need every ounce of that hardware's performance. Proxmox allows me to enforce strict, precise CPU and memory boundaries, ensuring that a massive spike in one experimental container doesn't choke out the resources of another, keeping the whole node perfectly stable.

### Identity and Routing

Having the apps running is one thing, but accessing them securely is another beast. I bought my own domain and configured Nginx as a reverse proxy. There were plenty of broken configs and late-night routing errors, but eventually, I got it running cleanly. Every service now sits on its own isolated subdomain (e.g., `app.lokeshrc.me`).

For security, I could have relied on simple `.htpasswd` files or basic authentication, but that creates friction and doesn't scale when you are constantly spinning up new services. Instead, I deployed Keycloak.

Why Keycloak? Because I wanted enterprise-grade, centralized authentication without having to write custom login logic for every single new project or service I host. It acts as my own personal, self-hosted Auth0. By wrapping my entire ecosystem in modern OIDC (OpenID Connect), I established a true Single Sign-On (SSO) experience. Whether I am accessing an off-the-shelf tool or my own custom endpoints, it is all protected by one robust, manageable identity layer.

### Keeping an Eye on the Metal

With all these containers running, I needed to know exactly what the RTX 5060 and CPU were doing at any given moment. I spun up Prometheus to scrape the metrics and built out Grafana dashboards to visualize the data. Now, I have real-time observability over my storage, container memory usage, and network traffic.

### Bridging the Gap

As an application developer, my world used to stop at the code commit. I was used to handing off Python backends and Dart applications to managed cloud providers and assuming the magic just worked. But building this infrastructure from the metal up fundamentally bridged the gap between my code and where it lives. I no longer just write the software; I govern the silicon it runs on.

_(More on my specific Nginx configurations coming soon!)_
