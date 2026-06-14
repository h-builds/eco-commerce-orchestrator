# 🏗️ Eco-Commerce Orchestrator

### **High-Performance Edge-Native Pricing Engine**

[**🔗 LIVE DEMO & PERFORMANCE BENCHMARK**](https://eco-commerce-orchestrator.achegideas.workers.dev/)

The **Eco-Commerce Orchestrator** is an industrial-grade distributed system designed to guarantee **mathematical determinism** and **price consistency** in real-time. It operates entirely on the global **Cloudflare Edge** infrastructure to minimize latency and maximize reliability.

![Status: Production Ready](https://img.shields.io/badge/status-production%20ready-emerald?style=for-the-badge)
![Tech: Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tech: Go Wasm](https://img.shields.io/badge/Go-Wasm-00ADD8?style=for-the-badge&logo=go)
![A11y: WCAG 2.1 AA](https://img.shields.io/badge/A11y-WCAG%202.1%20AA-blueviolet?style=for-the-badge)

---

## 🏛️ Architectural Intent (The "Why")

In modern global e-commerce, **latency is a conversion killer**. This project addresses the technical conflict between computational complexity and UI fluidity through three strategic pillars:

1.  **Main Thread Liberation:** We offload heavy business logic (mass price-rule transformations for 10,000+ items) to a **Go microservice compiled to WebAssembly**. This prevents "Long Tasks" and keeps the browser's main thread free for a smooth 60 FPS user experience.
2.  **Deterministic Consistency:** By executing pricing logic at the **Cloudflare Edge (Workers)** and synchronizing custom `splitmix64` PRNG algorithms, we ensure that calculations are bit-for-bit identical across any global node, eliminating discrepancies caused by varying client-side hardware or local time-drifts.
3.  **True Zero-Allocation Philosophy:** The Go engine is meticulously engineered to eliminate the "Garbage Collection tax" typically found in high-frequency pricing engines. By using inline `fnv64a` hashes and pre-allocated byte buffers, the hot loop operates at **~50 ns/op with exactly 0 B/op (zero allocations)**.

---

## ⚡ Performance Duel (Live Benchmarking)

The orchestrator features a real-time stress-test suite that pits the **V8 (JavaScript) JIT engine** against our **Edge-Native Wasm Engine (Go)**:

- **Stress Load:** 10,000 product entity transformations per cycle.
- **Precision Telemetry:** Implementation of **"Ping Subtraction"** to isolate pure compute time from network jitter, compensating for Cloudflare's execution clock freezes.
- **System Guardrails:** Features a degraded-state UI fallback pattern. If the edge network fails, the frontend gracefully alerts users and falls back to static database pricing without throwing unhandled exceptions.

---

## 🛠️ Tech Stack

| Layer             | Technology                  | Strategic Value                                             |
| :---------------- | :-------------------------- | :---------------------------------------------------------- |
| **Orchestration** | **Next.js 16 (App Router)** | Hybrid rendering and seamless Edge streaming.               |
| **Logic Engine**  | **Go (WebAssembly)**        | Low-latency, type-safe, and deterministic computation.      |
| **Runtime**       | **Cloudflare Workers**      | Global distribution with zero-cold-start performance.       |
| **Persistence**   | **Cloudflare D1 (SQLite)**  | Native Edge-SQL for real-time inventory hydration.          |
| **Interface**     | **Tailwind CSS**            | Information-dense UI tailored for performance telemetry and data-heavy applications. |

---

## 🚧 Project Roadmap (Completed)

The system has successfully completed its Telemetry Refinement & Technical Audit phase.

- [x] **Core:** Wasm/JS Bridge implementation.
- [x] **Optimization:** Zero-Alloc refactor for the Go pricing engine (0 allocs/op achieved).
- [x] **Metrics:** High-resolution ($\mu s$) telemetry via `performance.now`.
- [x] **Audit:** PDF Report Export module for executive summaries via `jspdf`.
- [x] **SEO:** D1 integration for dynamic, real-time sitemap generation.
- [x] **Dashboard:** Finalization of the Admin Telemetry Dashboard.

---

## 🚀 Local Development Architecture

This project is split into an Edge Orchestrator (Next.js) and an Edge Microservice (Go Wasm). You must run both locally.

1.  **Clone & Install:**
    ```bash
    git clone https://github.com/h-builds/eco-commerce-orchestrator.git
    cd eco-commerce-orchestrator
    npm install
    ```

2.  **Terminal 1: Run the Go Wasm Pricing Engine:**
    _(Requires Go 1.21+ and Wrangler)_
    ```bash
    cd services/pricing
    npx wrangler dev
    ```
    *This will auto-generate the JS bindings, compile the Go code to Wasm, and spin up a local Cloudflare Worker.*

3.  **Terminal 2: Run the Next.js Orchestrator:**
    ```bash
    npm run dev
    ```

---

## 👤 Author

**Horacio (@h-builds)**
_Senior UI/Frontend Lead | MBA_
Focused on high-performance distributed systems and edge computing. Remote, currently based in **Venezuela**.

---

> _"Engineered for strict zero-allocation determinism at the Edge."_ 🦒✨
