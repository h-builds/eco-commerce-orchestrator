```text
.
├── .env.example
├── .env.local
├── .eslintignore
├── .gitignore
├── .npmrc
├── CONTEXT.md
├── README.md
├── anatomy.md
├── app
│   ├── admin
│   │   └── dashboard
│   │       └── page.tsx
│   ├── api
│   │   ├── graphql
│   │   │   └── route.ts
│   │   └── seed
│   │       └── route.ts
│   ├── benchmarks
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── robots.ts
│   ├── shop
│   │   ├── [slug]
│   │   │   └── page.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   └── sitemap.ts
├── commit-guide.md
├── components
│   ├── atoms
│   │   └── AnimatedCounter.tsx
│   ├── molecules
│   │   ├── BackButton.tsx
│   │   ├── BigNumberMetric.tsx
│   │   ├── ComparisonChart.tsx
│   │   ├── DownloadExecutiveReportButton.tsx
│   │   ├── EdgeMap.tsx
│   │   ├── ExecutiveBrief.tsx
│   │   ├── PredictivePriceAlert.tsx
│   │   ├── PricingStatus.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductSkeleton.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SimulatingProductCard.tsx
│   │   ├── SingleProductTelemetry.tsx
│   │   ├── StressTestTrigger.tsx
│   │   ├── SuccessMetricsCards.tsx
│   │   ├── TechnicalAudit.tsx
│   │   ├── TelemetryHUD.tsx
│   │   ├── VolatilityChart.tsx
│   │   └── WasmThroughputChart.tsx
│   ├── organisms
│   │   ├── ComparisonBar.tsx
│   │   ├── ComparisonModal.tsx
│   │   ├── DashboardClient.tsx
│   │   ├── DebugConsole.tsx
│   │   ├── GlobalNav.tsx
│   │   ├── ProductBrowser.tsx
│   │   └── ProductGrid.tsx
│   └── providers
│       ├── DebugBridge.tsx
│       ├── StressTestRegistryProvider.tsx
│       └── TourProvider.tsx
├── eslint.config.mjs
├── hooks
│   └── useIntersectionObserver.ts
├── knowledge
│   ├── code-2.html
│   └── code.html
├── lib
│   ├── CompareContext.tsx
│   ├── ReportDataContext.tsx
│   ├── SimulationContext.tsx
│   ├── TelemetryContext.tsx
│   ├── batchOrchestrator.ts
│   ├── benchmarking.ts
│   ├── contracts.ts
│   ├── db
│   │   ├── schema.sql
│   │   └── seed.ts
│   ├── db.ts
│   ├── efficiencyScore.ts
│   ├── executiveReportPdf.ts
│   ├── hexSeed.ts
│   ├── hudTelemetry.ts
│   ├── pricing.ts
│   ├── pricingEngine.ts
│   ├── pricingWorkerClient.ts
│   ├── runPricingBatch.ts
│   ├── stressTest.ts
│   ├── wasmTelemetry.ts
│   └── workers
│       └── pricing.worker.ts
├── next-env.d.ts
├── next.config.ts
├── open-next.config.ts
├── package-lock.json
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── public
│   ├── _headers
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── pricing-agent.wasm
│   ├── vercel.svg
│   └── window.svg
├── services
│   └── pricing
│       ├── bench_test.go
│       ├── build
│       │   ├── app.wasm
│       │   ├── runtime.mjs
│       │   ├── wasm_exec.js
│       │   └── worker.mjs
│       ├── go.mod
│       ├── go.sum
│       ├── main
│       ├── main.go
│       ├── main_test.go
│       ├── oracle_test.go
│       ├── pricing-agent.test
│       ├── race_test.go
│       ├── stress_bench_test.go
│       ├── stress_test.go
│       ├── test_determinism_test.go
│       ├── test_gofloat_test.go
│       └── wrangler.toml
├── tests
│   ├── global.setup.ts
│   ├── responsive-audit.spec.ts
│   ├── telemetry.spec.ts
│   ├── tier1.spec.ts
│   ├── tier3.spec.ts
│   └── tier4.spec.ts
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── wrangler.toml

24 directories, 119 files
```
