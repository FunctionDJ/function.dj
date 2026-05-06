---
title: Notes on using one or more Blackmagic Shuttles
description: These capture cards are EXTREMELY picky. Here's some advice on how to not lose your mind.
pubDate: "2026-04-24"
draft: true
---

<!-- TODO: update this page when published: https://github.com/FunctionDJ/Automeleec/wiki/Blackmagic-Design-Intensity-Shuttle-notes/_edit -->

The Blackmagic Design Intensity Shuttle is a unique capture card with features that are desirable for recording and streaming games that were made for the era of CRT TVs. In my case, those games are Super Smash Bros. Melee and Super Smash Bros. Brawl (with mods like Project+).

However, Shuttles are _extremely picky_ about how they are deployed and used and will let you down quickly if the environment is not _just right_ for them - or maybe even because they just feel like it.

## 1. Why even use a Shuttle?

The Shuttle has a property that makes it stand out from most other capture cards:\
It can not only capture a component / 480p video signal (the best video you can get from an unmodified Nintendo Wii), it can also output that same video signal as NTSC 480i through it's composite output. This component-to-composite conversion makes it possible to capture 480p while feeding 480i into NTSC-compatible CRTs and has proven itself in the delay-sensitive Smash E-sports community to have no perceivable latency or delay.

If you don't need 480p capture, use an AV Splitter and a GV-USB2, which is a lot less painful to use than a Shuttle.

## 2. USB versus Thunderbolt

The Shuttle comes in two versions: A USB 3.0 version and a Thunderbolt 2 version.

The Thunderbolt version is usually cheaper and more reliable than the USB version because TB 2 supports more bandwidth, but the USB version is easier to integrate because almost all computers have USB, while only very few have Thunderbolt. And to use the TB 2 version with TB 3, 4 or 5, you need an active adapter that might close the price gap.
Personally, I'd probably only choose the TB 2 version if I happened to have a known-working adapter already.
I'm only focusing on the USB version from this point on.

## 3. Use the right cable

Avoid third-party USB cables, try to use the original cable that came with the Shuttle. If you don't have it or need a replacement, buy a 1m or shorter cable from a reputable, high-quality brand. If the cable is too long, the Shuttle might misbehave because of signal integrity.

## 4. Don't use USB hubs

Avoid using USB hubs or USB extensions. Similar to using an unsuitable cable, the Shuttle might misbehave. These devices are not designed to share a USB port on your computer with another device. If you try it, it _might_ work, but it also _might_ suddenly stop working in the worst possible moment during production. And if you use the Shuttle's 480i / composite output to feed into CRTs (why else would you use a Shuttle?), this could disable the video feed to the CRT. And if you're streaming an intense Grand Finals set of a Smash Bros. tournament, you absolutely don't want to risk this happening.

- configure Slippi Nintendont like this to be able to capture 480p / 59.94 FPS:
  - Force Progressive: On
  - Video: Force or Force (Deflicker)
  - Videomode: NTSC
- Shuttle outputs NTSC **_only_** (via composite at least)
  - that means NTSC-capable CRTs are **_required_** unless you're fine with composite / 480i capture and use an A/V splitter between the Wii and Shuttle and set the output to PAL60 in Slippi Nintendont
    - (if you go the A/V splitter route, you're not gaining anything from using a Shuttle vs. just using a different 480i capture card like a GV-USB2)
- using more than like 1-2 Shuttles is a **_major_** PITA. avoid it if you can. we were unable to get 4 Shuttles working at once at SAPF 2.
  - if you MUST do a 4x Shuttle setup, ideally you'd use 4 computers with their sole job being connecting to a single Shuttle and then outputting the feed with HDMI and using a PCIe 4x HDMI capture card on the fifth PC for streaming. this is obviously very expensive, tedious, and takes a lot of space, but it's a lot more stable and flexible than attempting to use multiple Shuttles on one computer.
    - maybe it's possible to avoid having 4 computers for capturing and outputting the Shuttles if you can at least power them all (so that they output to the CRT) and then maybe you can use the Shuttle's HDMI outputs with a 4x PCIe capture card? i have not tested this yet, this is just an idea.
  - if you seriously MUST use multiple Shuttles on one computer, at least make sure they're on separate USB controllers using this tool: https://www.uwe-sieber.de/usbtreeview_e.html
