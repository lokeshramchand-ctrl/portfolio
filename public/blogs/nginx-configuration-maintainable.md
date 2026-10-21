---
title: "Building an Nginx Configuration I Could Actually Maintain"
date: "July 22, 2026"
excerpt: "How my reverse proxy config went from one fragile file to something I can change without fear, and the reload mistake I kept making."
tags: ["DevOps", "Infrastructure", "Engineering"]
---

When I first set up my reverse proxy, I treated Nginx as a black box that would keep working as long as I didn't look inside. That stopped working pretty quickly.

## Everything in one file

My first config had everything crammed into `/etc/nginx/nginx.conf`. Every new service got another `server` block. Finding anything took a while. Then I made one typo, a missing semicolon, and every service I ran went down at the same time.

## Splitting it up

I started treating the config like code. I moved to the `sites-available` / `sites-enabled` pattern so each subdomain has its own file. If I change Keycloak routing, I only touch `keycloak.conf`.

I was also copy-pasting SSL parameters and proxy headers everywhere, so I moved them into one snippet:

```nginx
include snippets/proxy-params.conf;
```

## Two domains, one backend

At one point I needed two different domains pointing at the same service. My first instinct was another container, which would have been wasteful. It turns out one server block can list both:

```nginx
server {
    listen 443 ssl;
    server_name app.lokeshrc.me alternate-route.me;

    ssl_certificate /etc/letsencrypt/live/lokeshrc.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lokeshrc.me/privkey.pem;

    location / {
        proxy_pass http://10.0.0.120:8080;
        include snippets/proxy-params.conf;
    }
}
```

Nginx matches on the `Host` header and sends both to the same LXC container. The backend never knows which URL the user typed.

## The command I run every time

```bash
sudo nginx -t
```

It catches missing semicolons and unclosed braces before they take everything down. It can't catch everything, though.

My most embarrassing habit: I'd rewrite a config, see `syntax is ok, test is successful`, refresh the browser, and nothing would change. I'd check logs and restart containers before remembering that I never told Nginx to load the new config.

Then I'd fix it with:

```bash
sudo systemctl restart nginx
```

That works, but it kills the service and drops every active connection. What I should have been running is:

```bash
sudo systemctl reload nginx
```

Reload starts new workers with the new config and lets the old ones finish their requests. It took me longer than I'd like to admit to learn the difference.

## What it taught me

I used to think of server config as something you set up once and forget. Now I treat it like the rest of my code: split into modules, reuse shared parts, and validate before shipping. Since I started doing that, it's been much easier to keep running.
