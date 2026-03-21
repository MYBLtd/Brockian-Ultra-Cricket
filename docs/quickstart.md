i# Quickstart

This quickstart is intentionally simple.

It is not meant to explain every part of BUC in detail.  
It is meant to help you get from “what is this?” to “I have something running.”

## What you need

At a minimum, you need:

- a system that can run the BUC server
- a browser to view the UI
- one or more data sources that BUC can present
- a small amount of configuration

Right now, BUC is most comfortable in a browser-first workflow.

That means the easiest starting point is:
- run the server
- define one browser device
- define one screen
- open that screen in a browser

## Basic flow

The practical flow looks like this:

1. configure your data sources
2. define components
3. define a screen
4. define a device that uses that screen
5. start the BUC server
6. open the device UI in a browser

## Start small

The best first test is not a complete installation.

The best first test is something like:
- one weather page
- one climate page
- one status page

Pick one useful screen and get that working first.

## Suggested first target

If you are new to BUC, start with:
- a browser device
- one screen
- one or two components

This keeps the number of moving parts low and makes it easier to understand what the framework is doing.

## Configuration model

BUC is configured around a few core ideas:

- **sources** provide data
- **components** describe reusable presentation units
- **screens** compose components into layouts
- **devices** define where and how a screen is shown
- **themes** define visual language

You do not need to master all of this at once.

You only need enough to describe one useful screen.

## What this section will grow into

Later, the installation docs will expand into more detailed guides such as:

- server setup
- browser device setup
- theme setup
- component configuration
- screen composition
- multi-screen devices
- embedded player setup

For now, this document exists to make one thing clear:

**BUC can start small, and it should.**

## Deployment note

The simplest and safest BUC deployment model is a trusted local network.

If remote access is required, BUC should be placed behind an appropriate access control layer such as a VPN or an authenticated reverse proxy. Direct public exposure without additional protection is not recommended.
