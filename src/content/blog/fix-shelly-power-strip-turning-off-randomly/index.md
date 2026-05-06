---
title: "Fix Shelly Power Strip turning off randomly"
description: "TL;DR"
pubDate: "24.04.2026"
draft: false
---

Is your Shelly Power Strip (in my case Gen4) randomly turning off all sockets every few days?

This is probably because of updates or some other internal mechanism.\
Here's how to fix it:

1. Open the web interface of the Shelly device
2. On the "Home" tab click the switch's entry (not the on/off button, just anywhere else on the entry):
   ![Screenshot of the devices web interface](image-1.png)
3. Next, click "Output settings":
   ![Screenshot of the devices web interface](image.png)
4. Select "Turn On" or "Restore last known state of output/relay" depending on your preference.
   ![Screenshot of the devices web interface](image-2.png)
5. Click "save settings".
6. Repeat for all 4 switches.
