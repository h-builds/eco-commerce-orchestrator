/**
 * Cloudflare Workers JS entry point for the Go Wasm pricing agent.
 *
 * Architecture note — why no top-level await:
 *  Cloudflare Workers disallows "unsettled" top-level await (error 10021).
 *  The Wasm module is instead initialised lazily: the first incoming request
 *  triggers instantiation; subsequent ones hit the cached promise directly.
 *  This is the standard Workers pattern for WebAssembly bootstrapping.
 *
 * Why wasm_exec.js:
 *  `GOOS=js GOARCH=wasm` produces JS-hosted Wasm — NOT standalone WASI.
 *  It requires Go's wasm_exec.js shim (provides the global `Go` class) to
 *  bridge DOM/JS APIs that the Go runtime expects.  The [[rules]] type "Data"
 *  in wrangler.toml instructs esbuild to embed main.wasm as an ArrayBuffer,
 *  which is the correct input for WebAssembly.instantiate() in this mode.
 */

// Provides the global `Go` class used to bootstrap GOOS=js Wasm binaries.
// Copied from $(go env GOROOT)/lib/wasm/wasm_exec.js during the build step.
import "./wasm_exec.js";

// main.wasm is embedded as a WebAssembly.Module by esbuild (rules type = "CompiledWasm").
import wasmModule from "./main.wasm";

// Lazy singleton — resolves once, shared across all requests in this isolate.
let initPromise = null;

function initWasm() {
  if (!initPromise) {
    initPromise = (async () => {
      const go = new Go();
      // wasmModule is already a compiled WebAssembly.Module
      const instance = await WebAssembly.instantiate(
        wasmModule,
        go.importObject,
      );
      // go.run() starts the Go runtime, which calls main() → http.HandleFunc
      // + workers.Serve(), registering the global Cloudflare fetch handler.
      go.run(instance);
    })();
  }
  return initPromise;
}

const handler = {
  async fetch(request, env, ctx) {
    // Ensure the Go runtime is ready before forwarding the request.
    await initWasm();
    // syumai/workers registers itself on globalThis during go.run().
    return globalThis.__syumai_workers_fetch_handler(request, env, ctx);
  },
};

export default handler;
