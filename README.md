# 🏗️ Eco-Commerce Orchestrator

### **High-Performance Edge-Native Pricing Engine**

[**🔗 LIVE DEMO & PERFORMANCE BENCHMARK**](https://eco-commerce-orchestrator.pages.dev)

The **Eco-Commerce Orchestrator** is an industrial-grade distributed system designed to guarantee **mathematical determinism** and **price consistency** in real-time. It operates entirely on the global **Cloudflare Edge** infrastructure to minimize latency and maximize reliability.

![Status: Under Construction](https://img.shields.io/badge/status-under%20construction-orange?style=for-the-badge)
![Tech: Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tech: Go Wasm](https://img.shields.io/badge/Go-Wasm-00ADD8?style=for-the-badge&logo=go)

---

## 🏛️ Architectural Intent (The "Why")

In modern global e-commerce, **latency is a conversion killer**. This project addresses the technical conflict between computational complexity and UI fluidity through three strategic pillars:

1.  **Main Thread Liberation:** We offload heavy business logic (mass price-rule transformations for 10,000+ items) to a **Go binary compiled to WebAssembly**. This prevents "Long Tasks" and keeps the browser's main thread free for a smooth 60 FPS user experience.
2.  **Deterministic Consistency:** By executing pricing logic at the **Cloudflare Edge (Workers)**, we ensure that calculations are identical across any global node, eliminating discrepancies caused by varying client-side hardware or local time-drifts.
3.  **Zero-Allocation Philosophy:** The Go agent is engineered to minimize Heap allocations. By using low-level byte manipulation and manual resets, we eliminate the "Garbage Collection tax" typically found in high-frequency trading or pricing engines.

---

## ⚡ Performance Duel (Live Benchmarking)

The orchestrator features a real-time stress-test suite that pits the **V8 (JavaScript) JIT engine** against our **Edge-Native Wasm Agent (Go)**:

- **Stress Load:** 10,000 product entity transformations per cycle.
- **Precision Telemetry:** Implementation of **"Ping Subtraction"** to isolate pure compute time from network jitter, compensating for Cloudflare's Spectre-related execution clock freezes.
- **Senior Insight:** While JS excels at local micro-optimizations, the Wasm Agent provides the **deterministic performance and safety** required for critical financial logic in stateless environments.

---

## 🛠️ Tech Stack

| Layer             | Technology                  | Strategic Value                                             |
| :---------------- | :-------------------------- | :---------------------------------------------------------- |
| **Orchestration** | **Next.js 16 (App Router)** | Hybrid rendering and seamless Edge streaming.               |
| **Logic Engine**  | **Go (WebAssembly)**        | Low-latency, type-safe, and deterministic computation.      |
| **Runtime**       | **Cloudflare Workers**      | Global distribution with zero-cold-start performance.       |
| **Persistence**   | **Cloudflare D1 (SQLite)**  | Native Edge-SQL for real-time inventory hydration.          |
| **Interface**     | **Tailwind CSS**            | High-density "Command Center" aesthetic for data-heavy UIs. |

---

## 🚧 Project Roadmap (Work in Progress)

The system is currently in the **Telemetry Refinement & Technical Audit** phase.

- [x] **Core:** Wasm/JS Bridge implementation.
- [x] **Optimization:** Zero-Alloc refactor for the Go pricing agent.
- [x] **Metrics:** High-resolution ($\mu s$) telemetry via `performance.now`.
- [ ] **Audit:** PDF/PNG Report Export module for executive summaries.
- [ ] **SEO:** D1 integration for dynamic, real-time sitemap generation.
- [ ] **Dashboard:** Finalization of the Cyberpunk-themed Admin HUD.

---

## 🚀 Local Development

1.  **Clone & Install:**
    ```bash
    git clone [https://github.com/h-builds/eco-commerce-orchestrator.git](https://github.com/h-builds/eco-commerce-orchestrator.git)
    npm install
    ```
2.  **Build the Agent:**
    _(Requires Go 1.21+)_
    ```bash
    GOOS=js GOARCH=wasm go build -o public/agent.wasm services/pricing/main.go
    ```
3.  **Run Dev Environment:**
    ```bash
    npx wrangler dev
    ```

---

## 👤 Author

**Horacio (@h-builds)**
_Senior UI/Frontend Lead | MBA_
Focused on high-performance distributed systems and edge computing Remote, currently based in **Venezuela**.

---

> _"Built with human-led intent in a world of AI noise."_ 🦒✨
