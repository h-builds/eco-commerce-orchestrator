# 🏗️ Eco-Commerce Orchestrator

### **Deterministic Edge Pricing Engine — Portfolio Demo**

[**🔗 LIVE DEMO**](https://eco-commerce-orchestrator.achegideas.workers.dev/)

A portfolio-grade distributed pricing system that demonstrates **mathematical determinism** and **price consistency** across stateless Cloudflare Edge Workers. Built to showcase Senior Frontend Lead competencies: performance engineering, edge architecture, accessibility practices, and business-impact awareness.

![Status: Portfolio Demo](https://img.shields.io/badge/status-portfolio_demo-blue?style=for-the-badge)
![Tech: Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tech: Go Wasm](https://img.shields.io/badge/Go-Wasm-%2300ADD8?style=for-the-badge&logo=go)
![A11y: WCAG 2.1 AA](https://img.shields.io/badge/A11y-WCAG%202.1%20AA-blueviolet?style=for-the-badge)

---

## 🏛️ Architectural Intent

In global e-commerce, **latency directly impacts conversion**. This project addresses the tension between computational complexity and UI fluidity through three strategies:

1.  **Edge Pricing Offload:** Heavy pricing logic (batch transformations for 10,000+ items) runs in a **Go microservice compiled to WebAssembly**, deployed as a separate Cloudflare Worker. The Next.js orchestrator calls it via Service Bindings, keeping pricing computation off the client.

2.  **Deterministic Consistency:** Pricing calculations use a custom `splitmix64` PRNG seeded with `FNV-64a` hashes. Both the Go engine and the TypeScript fallback implement identical algorithms, ensuring bit-for-bit price parity across any Worker instance within the same hour window.

3.  **Zero-Allocation Hot Path:** The Go pricing function is engineered to avoid heap allocations in the critical loop. Benchmarked at **~50 ns/op with 0 B/op and 0 allocs/op** (verified — see [Benchmark Evidence](#-benchmark-evidence) below).

---

## ⚡ Performance Duel (Live Benchmarking)

The project includes a real-time benchmark page that compares **V8 (JavaScript) JIT execution** against the **Edge Go-Wasm engine**:

- **Workload:** 10,000 dynamic pricing operations per benchmark run.
- **Ping Subtraction:** Estimates pure compute time by subtracting a baseline network round-trip from the total Edge call. This is an approximation — Cloudflare Workers freeze `Date.now()` during I/O, so the reported internal timing is the most reliable signal.
- **Fallback Resilience:** If the Edge pricing agent is unreachable, the UI displays a "System Degraded" alert and falls back to static database prices without crashing.

---

## 📊 Benchmark Evidence

Benchmarks run on the Go pricing engine (`services/pricing`), measured locally:

```
goos: linux | goarch: amd64 | cpu: AMD Ryzen 5 8645HS

BenchmarkCalculateDynamicPrice-12    24,467,191    50.77 ns/op    0 B/op    0 allocs/op
BenchmarkCalculateDynamicPrice-12    24,002,876    50.17 ns/op    0 B/op    0 allocs/op
BenchmarkCalculateDynamicPrice-12    24,624,169    50.04 ns/op    0 B/op    0 allocs/op

BenchmarkFNVStack-12                 28,734,032    39.97 ns/op    0 B/op    0 allocs/op
BenchmarkStressCalculateDynamicPrice 29,265,055    38.72 ns/op    0 B/op    0 allocs/op
```

**Methodology:** `go test -bench=. -benchmem -count=3`. Escape analysis (`-gcflags="-m=2"`) confirms `splitmix64` and `goFloat64` are inlined; the `[32]byte` buffer in `fnv64a` stays on the stack.

> These are native Go benchmarks on the host CPU. When compiled to `GOOS=js GOARCH=wasm` and executed inside a Cloudflare Worker, actual throughput will differ due to the Wasm runtime overhead and timer resolution constraints.

---

## 🛠️ Tech Stack

| Layer             | Technology                      | Role                                                        |
| :---------------- | :------------------------------ | :---------------------------------------------------------- |
| **Orchestration** | **Next.js 16 (App Router)**     | React 19 Server Components with the React Compiler enabled  |
| **Logic Engine**  | **Go → WebAssembly**            | Deterministic pricing via `splitmix64` + `FNV-64a` hashing  |
| **Runtime**       | **Cloudflare Workers**          | Edge deployment via `@opennextjs/cloudflare`                |
| **Persistence**   | **Cloudflare D1 (SQLite)**      | Product catalog and dynamic sitemap generation               |
| **Data Layer**    | **GraphQL (graphql-yoga)**      | Type-safe product queries with batch pricing resolution      |
| **Caching**       | **Cloudflare KV**               | Edge key-value store for caching                             |
| **Styling**       | **Tailwind CSS 4**              | Utility-first CSS with custom design tokens                  |
| **Animation**     | **Framer Motion**               | Micro-interactions with `prefers-reduced-motion` support     |
| **Testing**       | **Playwright + Go testing**     | E2E tests, Go unit/bench/race/determinism tests              |

---

## ✅ What's Implemented

- [x] **Go-Wasm Pricing Engine** — Deployed as a separate Cloudflare Worker with JSON-RPC 2.0 interface
- [x] **TypeScript Pricing Mirror** — Identical `splitmix64` + `FNV-64a` algorithms for client-side simulation
- [x] **Web Worker Offloading** — Local JS pricing runs in a dedicated Web Worker to avoid blocking the main thread
- [x] **Parallel Fan-out Batching** — 500-item chunks dispatched concurrently via `Promise.all()` with single-retry resilience
- [x] **Determinism Test Suite** — 10K-input oracle test, concurrent race detection, and cross-run stability tests
- [x] **D1-Powered Dynamic Sitemap** — Product URLs generated from D1 queries at request time
- [x] **Degraded-State UI** — Fallback to static prices with visible "System Degraded" alert when the pricing agent is offline
- [x] **Telemetry Dashboard** — Real-time HUD showing Wasm status, frame jitter, Edge RTT, and batch progress
- [x] **PDF Executive Report** — Downloadable benchmark report via `jspdf`
- [x] **Time Machine Simulation** — 24-hour slider to preview deterministic price changes per hour
- [x] **Accessibility** — Skip-to-content, `aria-live` regions, `focus-visible` rings, semantic HTML, `prefers-reduced-motion`
- [x] **SEO** — JSON-LD structured data, Open Graph, Twitter cards, robots.txt, canonical URLs
- [x] **Product Comparison** — Multi-product volatility overlay with Pearson correlation analysis

---

## 🚧 Scope & Limitations

This is a **portfolio demo**, not production software. Key boundaries:

- **Telemetry precision:** Cloudflare Workers freeze `Date.now()` around I/O boundaries. Internal exec time reported by the Go agent uses `time.Since()` which is subject to Wasm runtime resolution. Ping subtraction provides an approximation, not microsecond-accurate measurements.
- **Pricing model:** The volatility algorithm is a simplified simulation (±5% range from a hash-derived seed). It demonstrates the determinism architecture, not a real market pricing model.
- **Scale:** Tested with synthetic datasets up to 10K items. No load testing against production traffic patterns.
- **Cold start:** Cloudflare Workers minimize cold starts but do not eliminate them. No zero-cold-start guarantee is made.

---

## 🚀 Local Development

The project consists of a **Next.js orchestrator** and a **Go-Wasm pricing microservice**.

### Prerequisites
- Node.js 22+
- Go 1.21+
- Wrangler CLI (`npm i -g wrangler`)

### Setup

```bash
git clone https://github.com/h-builds/eco-commerce-orchestrator.git
cd eco-commerce-orchestrator
npm install
```

### Terminal 1: Go-Wasm Pricing Engine
```bash
cd services/pricing
npx wrangler dev
```
This compiles Go to Wasm, generates JS bindings, and starts a local Cloudflare Worker.

### Terminal 2: Next.js Orchestrator
```bash
npm run dev
```

### Running Go Tests & Benchmarks
```bash
cd services/pricing

# All tests (determinism, oracle, stress, race detection)
go test -v ./...

# Benchmarks with allocation reporting
go test -bench=. -benchmem -count=3 -run='^$' ./...

# Race detector on core functions
go test -race -run 'TestRaceCalculateDynamicPrice|TestStressDeterminism' ./...
```

---

## 👤 Author

**Horacio (@h-builds)**
_Senior UI/Frontend Lead | MBA_
Focused on high-performance distributed systems and edge computing. Remote, currently based in **Venezuela**.

---

> _"Deterministic pricing at the Edge — verified, not claimed."_ 🦒✨
