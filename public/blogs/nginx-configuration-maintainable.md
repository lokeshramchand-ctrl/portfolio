---
title: "Building an Nginx Configuration I Could Actually Maintain"
date: "Aug 1, 2026"
excerpt: "A practical guide to creating and maintaining Nginx configurations that are both efficient and easy to manage."
tags: ["DevOps", "Infrastructure", "Engineering"]
---

When I first set up my reverse proxy, I treated Nginx like a black box. You know, one of those things that "just works" if you don't look inside too carefully. Spoiler: that approach doesn't scale.

## The Beginning: Everything in One File

My first Nginx config was exactly what you'd expect from someone learning on the job—a sprawling mess of everything crammed into `/etc/nginx/nginx.conf`.

Every new service got a new `server` block dropped into this growing monstrosity. Need to route traffic to `app1.lokeshrc.me`? Add a block. Got a database API? Another block. Before long, I had this massive, unwieldy configuration file where finding anything felt like archaeology.

The real problem hit when I made a syntax error. One typo, one missing semicolon, and *every single service* on my infrastructure went down. That's when I realized: this wasn't sustainable.

## The Lightbulb Moment

Here's what clicked for me: **Nginx configuration is just code.** And like any good code, it needs to be modular.

I scrapped the monolithic approach and reorganized everything using the classic `sites-available` and `sites-enabled` pattern. Now each subdomain gets its own dedicated config file. If I need to adjust routing for Keycloak, I only touch `keycloak.conf`. No side effects. No risk of breaking something unrelated.

The next optimization was extracting the repetitive stuff. SSL parameters, proxy headers—I kept copy-pasting these blocks everywhere. So I created a shared snippet:

```nginx
include snippets/proxy-params.conf;
```

Instead of duplicating boilerplate in every config file, I just include that one snippet. It's a tiny change that made everything feel more organized and maintainable.

## The Two Domains, One Backend Problem

At some point, I needed to route two completely different domains to the same backend service. My first instinct was to spin up another container, but that's wasteful. Creating duplicate config files? That destroys the whole modularity concept.

The solution was elegant: Nginx lets you bind multiple domains to a single server block.

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

By listing both domains in `server_name`, Nginx checks the incoming `Host` header and routes traffic from either domain to the exact same backend. The LXC container never needs to know which URL the user typed in.

Here's what that flow looks like:

```text
       [ Public Internet ]
               │
    ( app.lokeshrc.me / alternate-route.me )
               │
      [ Nginx Reverse Proxy ]
       ( sites-enabled/app.conf )
               │
    [ proxy_pass http://10.0.0.120:8080 ]
               │
 [ LXC Container: Backend Service ]
```

## The Command That Saved My Sanity

If I had to pick one tool that kept me from completely embarrassing myself, it's this:

```bash
sudo nginx -t
```

This validates your configuration *before* you apply it. It's your compiler. It catches missing semicolons, unclosed braces, typos—all the stupid mistakes that would otherwise bring down your entire infrastructure.

But validation isn't a silver bullet. I still managed to spectacularly mess up in ways no syntax checker could catch.

### The Embarrassment That Taught Me

My crowning achievement in stupidity? I'd carefully rewrite a config, run `nginx -t` (which would happily report `syntax is ok, test is successful`), then refresh my browser expecting everything to work... and nothing would change.

I'd sit there, baffled. Checking logs, restarting containers, wondering if I was losing my mind. Then it would finally hit me: **I forgot to actually tell Nginx to use the new configuration.**

When I finally realized what I'd done, I'd hit the nuclear option:

```bash
sudo systemctl restart nginx
```

This works, sure, but it's sledgehammer-level aggressive. It kills the entire service and starts fresh—and that means any active connections get dropped. Users get disconnected mid-request. Not great.

The proper way? Use reload instead:

```bash
sudo systemctl reload nginx
```

This gracefully brings up new worker processes with your updated config while letting the old processes finish their active requests. Same result, no dropped connections, no angry users.

It took me way longer than I'd like to admit to learn that distinction.

## What This Actually Taught Me

The lesson isn't really about Nginx syntax. It's about treating infrastructure like the living codebase it actually is.

I used to think of server configuration as a one-time setup—configure it, forget it, move on. But that's backwards. Your infrastructure deserves the same clean architecture, modularity, and care that you put into the code running on top of it.

The moment I started applying actual software engineering principles to my Nginx configs—modular organization, reusable components, automated validation—everything became easier to maintain, debug, and scale.

Your infrastructure isn't plumbing. It's code. Treat it that way.