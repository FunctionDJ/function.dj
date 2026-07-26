---
title: "Create systemd unit files via CLI"
description: "It's kind of cheating, just a little bit."
pubDate: "28.05.2026"
draft: true
---

I was wondering if there's a CLI to create systemd unit files. Why? I don't really know. Honestly, `systemctl edit --full --force` (`--force` is to create it if it doesn't exist yet) is already mostly fine and will also do `daemon-reload` for you.

Anyway, here's what you can do: Use `systemd-run` (TODO: link to docs) with `--on-calendar` or `--timer-property`. Maybe you already know this to create _temporary_ units that will be gone after a reboot. But systemd actually creates those unit files for you! After all, everything in Linux is supposed to be a file, right? It's just that they're created in `/run`.

So all you have to do is copy them to `/etc/systemd/system`, stop the temporary unit/timers you created if needed, do a little `daemon-reload`, and you should be golden. Though I should mention that you probably still want to read and check those unit files before you install them permanently. Who knows what the CLI is up to.

Thanks to `gdamjan` on the Library systemd IRC channel for telling me about this method. (I have no clue they or anyone else actually does this)
