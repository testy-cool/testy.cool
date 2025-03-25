---
title: LLM CLI Utility Cheatsheet
description: Personal cheatsheet for Simon Willison's LLM CLI utility, covering common commands and configurations.
published: 2025-03-21T02:58:09+02:00
draft: true
---

This is a personal cheatsheet for the [LLM CLI utility](https://llm.datasette.io/en/stable/index.html) by Simon Willison.

`llm models`: Manage models.
`llm models list`: List models. Options: `--options`, `--async`, `--schemas`, `-q`.
`llm models default`: Show/set default model.
`llm plugins`: List plugins.

Example output of `llm plugins`:

```text
[
  {
    "name": "llm-anthropic",
    "version": "0.11"
  },
  {
    "name": "llm-gguf",
    "version": "0.1a0"
  },
  {
    "name": "llm-clip",
    "version": "0.1"
  },
  {
    "name": "llm-cmd",
    "version": "0.2a0"
  },
  {
    "name": "llm-gemini",
    "version": "0.3"
  }
]
```