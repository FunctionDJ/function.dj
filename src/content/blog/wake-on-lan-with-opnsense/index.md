---
title: Wake on LAN with OPNsense
pubDate: "2026-05-11"
description: "You don't need firewall rules for magic packets - you need HTTP :)"
draft: false
---

## The What and How

I want to be able to wake up my server from my phone, or using curl. But it's not working! Probably because my server and phone sit in different subnets / VLANs. But I don't want to figure out how to set up firewall rules or magic paket forwarding or whatever it needs that I'll have to maintain - I want a simple, sustainable solution.

Good news, there is one. The trick is letting OPNsense send the magic paket _for you_. How? APIs of course! And when we have an API we can reach and use, we can use it from anywhere! For example, with Home Assistant - more on that later.

## 0. Enable Wake on LAN and note the MAC address

We'll call the device to be woken up the _target_. Before we can continue, your target needs to be capable of wake on LAN and you likely need to enable it. On servers with consumer hardware, you can usually do this in the BIOS or UEFI. Search online for your hardware to find instructions if you're unsure.

To use WOL you need to know the MAC address of a connected network interface of the target. You might be able to get this from your DHCP leases, static DHCP mappings, or simply running `ip a` on your target if it's a Linux server for example. With `ip a`, if you see many entries with MAC addresses, you'll have to figure out which one that's connected to your network. If you have multiple MAC addresses / interfaces that are connected to your network, you likely know what you're doing and don't need this guide.

Ideally you should test WOL from the same subnet or VLAN as your target to confirm it actually wakes up when it receives a WOL magic paket. You should do it from the same subnet because generally your sender and target can then communicate directly without any firewall filters getting in the way. Depending on your network setup, you could just put a cheap 5-port network switch between the target's network cable and the target. Connect the target and any other desktop or laptop to the switch and use a WOL client of your choice to try it out.

## 1. Install Wake on LAN plugin

OPNsense doesn't really support being a WOL client out of the box, but there's the `os-wol` plugin that will do that.

Open the OPNsense GUI, go to `System` -> `Firmware` -> `Plugins`, search for "wol" or "os-wol" and install it.

## 2. Create a new OPNsense user

You know that you shouldn't use root for everything and that it's a good practise to only give a user the minimal permissions that it needs. So we're going to create a new user in OPNsense that's only allowed to trigger WOL commands.

In the OPNsense GUI, go to `System` -> `Access` -> `Users` and click the button with the plus icon. Give it a name and a secure password (though we won't use it) and under "Privileges" search for "wake" and you should find an option called "Services: Wake on LAN" which you can select.

After saving, you'll see the user list again. In the new row for our user, look at the "Commands" column and find the button with the mouse hover text "Create and download API keys for this user" (it has an icon that looks like a movie ticket). Clicking the button and confirming the popup downloads a .txt file.

## 3. Get the network identifier

If we want to use the API to wake a device, we'll need to tell OPNsense on which interface it should send the magic paket on (be it physical or virtual like for a VLAN, doesn't matter). In the OPNsense GUI, go to `Interfaces` and select the interface where your device lives that you want to wake up. In the page for the interface, copy the value that's labelled as the "Identifier". This could be something like "igc1" or "opt1" or something completely different. Note that these identifiers are not the same as interface descriptions, which is what's shown in the interface list in the `Interfaces` menu in the GUI, surrounded by angled brackets.

## 4. Try out the WOL API using curl

Try using the API from any device that can use curl and can ping your OPNsense firewall. _Note: You may need to add the `--insecure / -k` flag to skip TLS verification if you connect to your OPNsense using a self-signed certificate (which is how you use OPNsense out of the box)._

```curl
curl -X POST "https://your-opnsense-ip:8000/api/wol/wol/set" \
	-u '["key" from .txt goes here]:["secret" from .txt goes here]'
	-H "Content-Type: application/json" \
	-d '{"wake":{"interface":"[identifier goes here]","mac":"[target MAC goes here]"}}'
```

_(remove the angled brackets)_

Example:

```curl
curl -k -X POST "https://192.168.0.1:8000/api/wol/wol/set" \
  -u 'Kc/vYhlWU/K4fS3N3vhyKJ1234oxwg2adbDtVJZLZwL2k5QhhmxhLa/mxxI4LNhqKyZougxnSMnHWiA6:Yz/7A1lTzSi+I4XXWMMrV1234FlwIwFZsowocpAH1r7dfBHRAGZLVk7aSBX2/n5tg4cwKaEmeV9GJIuS' \
  -H "Content-Type: application/json" \
  -d '{"wake":{"interface":"lan","mac":"AA:BB:CC:DD:EE:FF"}}'
```

Before hitting Enter, you can chant the following _(optional)_:

**_Rise from your slumber, lump of metal and quartz. I call upon your service._** (a dramatic hand gesture is recommended)

If the ritual was successful, you now weild the power of digital ~~necromancy~~ caffeine or something.

## 5. Optional: Trigger WOL with Home Assistant

Home Assistant does have a WOL module, but unless your HA instance is in the same subnet / VLAN as your target, it most likely won't work because magic pakets don't cross subnet boundaries by default. To call OPNsense from HA to do this for us, we'll use HA's RestAPI / `rest_command` integration, which for our purposes is the same as using `curl` - it's just that in HA you can this call to a button.

Edit your `configuration.yaml`:

```yaml
rest_command:
  opnsense_wake_client:
    url: "https://x.x.x.x:xxx/api/wol/wol/set" # actual IP and Port of the OPNsense WebGUI
    method: POST
    username: "Kc/vYhlWU/K4fS3N3vhyKJ1234oxwg2adbDtVJZLZwL2k5QhhmxhLa/mxxI4LNhqKyZougxnSMnHWiA6" # key from the txt
    password: "Yz/7A1lTzSi+I4XXWMMrV1234FlwIwFZsowocpAH1r7dfBHRAGZLVk7aSBX2/n5tg4cwKaEmeV9GJIuS" # secret from the txt
    content_type: "application/json"
    payload: '{"wake":{"interface":"lan","mac":"AA:BB:CC:DD:EE:FF"}}' # interface=identifier, mac=MAC-Address of the client
    verify_ssl: false # when you use the default self-signed cert from OPNsense
```

Edit your `template.yaml`:

```yaml
- button:
    - name: "WoL Client"
      press:
        - action: rest_command.opnsense_wake_client
```

_(YAML snippets copied from the user balrog at https://forum.opnsense.org/index.php?topic=51289.0)_

Nice! If you use the Home Assistant Android app like me, you can now easily wake the target from your phone.

## A note on authentication for the OPNsense API

I don't remember with which sources I used to set this up initially, but in my own `configuration.yaml` I actually use an authentication header instead of basic auth.

Basic auth (equivalent to `-u 'key:secret'` in `curl`):

```yaml
rest_command:
  opnsense_wake_client:
		# ...
    username: "Kc/vYhlWU/K4fS3N3vhyKJ1234oxwg2adbDtVJZLZwL2k5QhhmxhLa/mxxI4LNhqKyZougxnSMnHWiA6" # key from the txt
    password: "Yz/7A1lTzSi+I4XXWMMrV1234FlwIwFZsowocpAH1r7dfBHRAGZLVk7aSBX2/n5tg4cwKaEmeV9GJIuS" # secret from the txt
```

Authentication header (equivalent to `-H "Authorization: Bearer [token]"` in `curl`):

```yaml
rest_command:
  opnsense_wake_client:
		# ...
    headers:
      authorization: "Basic [token]"
      content-type: "application/json"
```

_(remove the angled brackets)_

The `token` is the same the content as what we used for `-u` (key + colon + secret), but Base64 encoded. So if one of the methods didn't work for you, try the other. I don't know if the OPNsense API is supposed to support only one or bot, or if this changed in an update (if you know, let me know).

Did you like this article? Send me a message via my socials, for example on Mastodon! (See top of bottom of page)

## Credits

I've mostly researched this topic myself across various documentations and forum posts when trying to set this up, but while writing this article specifically I came across [this forum post by user balrog](https://forum.opnsense.org/index.php?topic=51289.0) which I've copied some of the YAML examples from.
