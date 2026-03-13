package main

import (
	"encoding/json"
	"hash"
	"hash/fnv"
	"math"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/syumai/workers"
)

type JSONRPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	Method  string        `json:"method"`
	Params  []PricingArgs `json:"params"`
	ID      interface{}   `json:"id"`
}

type PricingArgs struct {
	ProductID string  `json:"product_id"`
	BasePrice float64 `json:"base_price"`
	Stock     int     `json:"stock"`
}

type JSONRPCResponse struct {
	JSONRPC            string        `json:"jsonrpc"`
	Result             interface{}   `json:"result,omitempty"`
	InternalExecTimeUs int64         `json:"internal_exec_time_us"`
	Error              *JSONRPCError `json:"error,omitempty"`
	ID                 interface{}   `json:"id"`
}

type JSONRPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type PricingResult struct {
	ProductID       string  `json:"product_id"`
	LivePrice       float64 `json:"live_price"`
	AgentConfidence float64 `json:"agent_confidence"`
}

/**
 * Deterministic pricing logic constrained for Wasm execution. Relies on 
 * localized operations to satisfy stateless node parity across the 
 * distributed Worker network.
 */
func calculateDynamicPrice(args PricingArgs, currentHour int64, h hash.Hash64) PricingResult {
	baseCost := args.BasePrice * 0.4
	maxPrice := args.BasePrice * 2.0

	currentPrice := args.BasePrice

	if args.Stock < 20 {
		currentPrice = currentPrice * 1.20
	}

	if args.Stock > 100 {
		currentPrice = currentPrice * 0.90
	}

	/**
	 * PERF: Hash key constructed via zero-alloc byte ops to avoid heap 
	 * allocations and JS interop overhead within the hot loop.
	 */
	h.Reset()
	h.Write([]byte(args.ProductID))
	h.Write([]byte{'-'})
	h.Write(strconv.AppendInt(nil, currentHour, 10))
	hashSum := h.Sum64()
	seed := int64(hashSum)
	r := rand.New(rand.NewSource(seed))

	volatilityMultiplier := 0.95 + r.Float64()*(1.05-0.95)
	currentPrice = currentPrice * volatilityMultiplier

	if currentPrice < baseCost {
		currentPrice = baseCost
	}
	if currentPrice > maxPrice {
		currentPrice = maxPrice
	}

	/**
	 * Confidence is derived as a pure, deterministic function of the hash 
	 * to ensure stability regardless of internal execution order or 
	 * code reorganization.
	 */
	confidence := 0.90
	if args.Stock < 20 {
		confidence += 0.05
	}
	if args.Stock > 100 {
		confidence += 0.05
	}
	hashUncertainty := float64(hashSum%1000) / 10000.0
	confidence -= hashUncertainty

	if confidence > 1.0 {
		confidence = 1.0
	} else if confidence < 0.0 {
		confidence = 0.0
	}

	roundedPrice := math.Round(currentPrice*100) / 100

	return PricingResult{
		ProductID:       args.ProductID,
		LivePrice:       roundedPrice,
		AgentConfidence: math.Round(confidence*100) / 100,
	}
}

/**
 * JSON-RPC gateway optimized for Cloudflare Service Bindings. Bypasses 
 * public ingress and standard authentication layers to minimize RTT 
 * within the internal Worker network.
 */
func rpcHandler(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var rpcReq JSONRPCRequest
	if err := json.NewDecoder(req.Body).Decode(&rpcReq); err != nil {
		sendError(w, rpcReq.ID, -32700, "Parse error")
		return
	}

	if rpcReq.Method == "ping" {
		rpcRes := JSONRPCResponse{
			JSONRPC: "2.0",
			Result:  true,
			ID:      rpcReq.ID,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rpcRes)
		return
	}

	if rpcReq.Method != "calculate_price" {
		sendError(w, rpcReq.ID, -32601, "Method not found")
		return
	}

	if len(rpcReq.Params) == 0 {
		sendError(w, rpcReq.ID, -32602, "Invalid params")
		return
	}

	start := time.Now()

	/**
	 * PERF: time.Now() and hasher allocation are hoisted outside the loop. 
	 * Each time.Now() in Wasm triggers a JS interop boundary crossing; 
	 * batching reduces this overhead from O(N) to O(1).
	 */
	currentHour := time.Now().Truncate(time.Hour).Unix()
	h := fnv.New64a()

	results := make([]PricingResult, len(rpcReq.Params))
	for i, param := range rpcReq.Params {
		results[i] = calculateDynamicPrice(param, currentHour, h)
	}

	execTimeUs := time.Since(start).Microseconds()

	rpcRes := JSONRPCResponse{
		JSONRPC:            "2.0",
		Result:             results,
		InternalExecTimeUs: execTimeUs,
		ID:                 rpcReq.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rpcRes)
}

/**
 * Transmits domain errors via HTTP 200 per JSON-RPC 2.0 spec. Prevents 
 * Next.js Route Handlers from triggering standard retry policies on 
 * application-level failures.
 */
func sendError(w http.ResponseWriter, id interface{}, code int, message string) {
	res := JSONRPCResponse{
		JSONRPC: "2.0",
		Error: &JSONRPCError{
			Code:    code,
			Message: message,
		},
		ID: id,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

func main() {
	http.HandleFunc("/rpc", rpcHandler)
	workers.Serve(nil)
}
