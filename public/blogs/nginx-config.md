---
title: "Building an Nginx Configuration I Could Actually Maintain"
date: "June 12, 2026"
excerpt: "A practical guide to creating and maintaining Nginx configurations that are both efficient and easy to manage."
tags: ["DevOps", "Infrastructure", "Engineering"]
---

# The Nginx Evolution: From Chaos to Modular Traffic Control


### The "One Giant File" Phase

When I first spun up my Proxmox environment, Nginx was a mystery. To me, it was just a black box that magically routed web traffic. Naturally, my journey started the way most do: by dumping absolutely everything into `/etc/nginx/nginx.conf`.

Initially, it was just a chaotic, ever-growing list of `server` blocks. Need to route `app1.lokeshrc.me` to an LXC container? Add a server block. Need to route a database API? Add another one.

Before I knew it, I had a massive, monolithic config file. Finding a specific configuration or debugging a broken proxy pass felt like playing _Where's Waldo?_ in a wall of curly braces. If I made a syntax error, it brought down the routing for every single service on my node. It was unsustainable.

### Moving to a Modular Architecture

I quickly realized Nginx configuration is just like writing software: **it needs to be modular.**

I wiped the slate clean and reorganized the architecture using the `sites-available` and `sites-enabled` pattern. I broke every single subdomain out into its own dedicated config file. Now, if I need to tweak the routing for my Keycloak instance, I only touch the `keycloak.conf` file.

To keep things even cleaner, I extracted repetitive configurations. Instead of copy-pasting the same SSL parameter blocks and proxy headers into every single file, I created a reusable `snippets/proxy-params.conf` and simply included it where needed:

```nginx
include snippets/proxy-params.conf;

```

This single architectural shift made my infrastructure organized, readable, and incredibly easy to scale.

### The Two-Domain, One-Destination Puzzle

Eventually, I needed to route two completely different domains (like `app.lokeshrc.me` and an alternative route) to the _exact same_ backend service running inside an LXC container. Spinning up a duplicate container wastes memory, and copy-pasting server blocks ruins modularity.

The elegant solution was Nginx’s multi-domain binding in a single server block:

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

By passing multiple space-separated domains to the `server_name` directive, Nginx evaluates the incoming `Host` header and seamlessly pipes traffic from both entry points to the exact same backend destination. It effectively decouples the public-facing URL from the internal architecture, meaning the LXC container never even needs to know which domain the user typed.

Here is a simple look at how that traffic flows:

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

### The Ritual of `nginx -t` (And My Dumbest Mistakes)

If there is one tool that saved my sanity during this process, it is:

```bash
sudo nginx -t

```

This command tests your configuration files for syntax errors before actually applying them. It acts as my compiler. It catches my missing semicolons, my unclosed curly braces, and my misspelled directives _before_ they cause actual downtime.

But even with a compiler, you still make silly mistakes.

My biggest facepalm moment? **Forgetting to actually apply the changes.**

I would spend 20 minutes meticulously reconfiguring a block, run `nginx -t` (which would triumphantly output `syntax is ok, test is successful`), head over to my browser to test the route, and... _nothing_. The old config was still running.

I'd sit there scratching my head, checking Proxmox logs, only to realize I forgot to tell Nginx to read the new code. And when I finally realized it, I would use the sledgehammer approach:

```bash
sudo systemctl restart nginx

```

It took me an embarrassingly long time to realize that `restart` aggressively kills and restarts the service, dropping active connections. The proper, graceful way to do this without interrupting existing traffic is:

```bash
sudo systemctl reload nginx

```

This safely spins up new worker processes with the new configuration while letting the old ones finish their active requests.

### The Takeaway

Nginx is incredibly powerful, but its true beauty lies in its simplicity once you treat it with the same clean architecture principles you use in software development.

Organizing my configurations didn't just fix my routing. It taught me that infrastructure isn't just plumbing you configure once and forget. It is a living, breathing codebase—and it deserves the exact same architectural respect as the applications running on top of it.
