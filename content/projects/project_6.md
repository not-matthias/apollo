+++
title = "Coverage-Guided Fuzzer"
description = "Catch edge-case bugs with intelligent input generation"
weight = 6
date = 2024-05-01

[extra]
github = "https://github.com/example/coverage-fuzzer"
card_links = [
  { url = "https://example-coverage-fuzzer.rtfd.io", text = "Docs", icon = "globe" },
  { url = "https://discord.gg/covfuzz", text = "Discord", icon = "discord" },
]
tags = ["rust", "llvm", "fuzzing"]
+++

A coverage-guided fuzzing engine that instruments compiled binaries to maximize code-path exploration. It integrates with existing build systems, correlates crashes with minimal reproducing inputs, and ships a triage dashboard for deduplicating and prioritizing findings. Designed for continuous fuzzing at scale with first-class support for sanitizer feedback and structured test input grammars.
