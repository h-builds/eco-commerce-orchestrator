package main

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"math"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/syumai/workers"
)

// JSONRPCRequest represents a standard JSON-RPC 2.0 request
type JSONRPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	Method  string        `json:"method"`
	Params  []PricingArgs `json:"params"`
	ID      interface{}   `json:"id"`
}

// PricingArgs are the arguments needed to calculate the dynamic price
type PricingArgs struct {
	ProductID string  `json:"product_id"`
	BasePrice float64 `json:"base_price"`
	Stock     int     `json:"stock"`
}

// JSONRPCResponse represents a standard JSON-RPC 2.0 response
type JSONRPCResponse struct {
	JSONRPC string        `json:"jsonrpc"`
	Result  interface{}   `json:"result,omitempty"`
	Error   *JSONRPCError `json:"error,omitempty"`
	ID      interface{}   `json:"id"`
}

// JSONRPCError represents a JSON-RPC 2.0 error object
type JSONRPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// PricingResult holds the response from the Agent
type PricingResult struct {
	ProductID       string  `json:"product_id"`
	LivePrice       float64 `json:"live_price"`
	AgentConfidence float64 `json:"agent_confidence"` // 0.0 to 1.0
}

func calculateDynamicPrice(args PricingArgs) PricingResult {
	// Base cost assumptions.
	// The price cannot drop below 40% of base (retail margin floor) or exceed 200%.
	baseCost := args.BasePrice * 0.4
	maxPrice := args.BasePrice * 2.0

	currentPrice := args.BasePrice

	// 1. Scarcity Surcharge: If stock < 20, apply a 20% increase.
	if args.Stock < 20 {
		currentPrice = currentPrice * 1.20
	}

	// 2. Eco-Incentive Discount: If stock > 100, apply a 10% discount.
	if args.Stock > 100 {
		currentPrice = currentPrice * 0.90
	}

	// 3. Volatility: deterministic fluctuation seeded by productID + current hour.
	// The same product in the same hour produces the same multiplier across all
	// Worker instances — required for a stateless, distributed pricing service.
	h := fnv.New64a()
	h.Write([]byte(fmt.Sprintf("%s-%d", args.ProductID, time.Now().Truncate(time.Hour).Unix())))
	hashSum := h.Sum64()
	seed := int64(hashSum)
	r := rand.New(rand.NewSource(seed))

	// Volatility multiplier in [0.95, 1.05] — one and only one rand draw.
	volatilityMultiplier := 0.95 + r.Float64()*(1.05-0.95)
	currentPrice = currentPrice * volatilityMultiplier

	// 4. Guardrails — clamp price to [baseCost, maxPrice].
	if currentPrice < baseCost {
		currentPrice = baseCost
	}
	if currentPrice > maxPrice {
		currentPrice = maxPrice
	}

	// 5. Confidence — a pure, deterministic function of stock thresholds and the
	// hash. No second r.Float64() call; confidence is not entangled with the
	// volatility draw order and will never shift if code is reorganised.
	confidence := 0.90
	if args.Stock < 20 {
		confidence += 0.05 // high-confidence scarcity signal
	}
	if args.Stock > 100 {
		confidence += 0.05 // high-confidence surplus signal
	}
	// Reduce by a deterministic fraction derived from the hash (0.000 – 0.099).
	// This encodes genuine uncertainty about market volatility without a second
	// non-deterministic rand call.
	hashUncertainty := float64(hashSum%1000) / 10000.0
	confidence -= hashUncertainty

	// Clamp confidence to [0.0, 1.0].
	if confidence > 1.0 {
		confidence = 1.0
	} else if confidence < 0.0 {
		confidence = 0.0
	}

	// Round to 2 decimal places.
	roundedPrice := math.Round(currentPrice*100) / 100

	return PricingResult{
		ProductID:       args.ProductID,
		LivePrice:       roundedPrice,
		AgentConfidence: math.Round(confidence*100) / 100,
	}
}

func rpcHandler(w http.ResponseWriter, req *http.Request) {
	// Security: Validate against environment variable using ConstantTimeCompare
	authHeader := req.Header.Get("Authorization")
	secret := os.Getenv("INTERNAL_SECRET")
	expectedAuth := "Bearer " + secret
	
	// Hash both values with SHA-256 to prevent length-leaking timing attacks
	authHash := sha256.Sum256([]byte(authHeader))
	expectedHash := sha256.Sum256([]byte(expectedAuth))

	if subtle.ConstantTimeCompare(authHash[:], expectedHash[:]) != 1 || secret == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if req.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var rpcReq JSONRPCRequest
	if err := json.NewDecoder(req.Body).Decode(&rpcReq); err != nil {
		sendError(w, rpcReq.ID, -32700, "Parse error")
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

	// Simulate pricing intelligence for all params
	results := make([]PricingResult, len(rpcReq.Params))
	for i, param := range rpcReq.Params {
		results[i] = calculateDynamicPrice(param)
	}

	rpcRes := JSONRPCResponse{
		JSONRPC: "2.0",
		Result:  results,
		ID:      rpcReq.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rpcRes)
}

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
	// JSON-RPC 2.0 §5: application-level errors MUST return HTTP 200.
	// Error detail belongs in the response body, not the HTTP status.
	// Using 4xx here caused the route.ts retry loop to fire on every
	// malformed request (parse error, wrong method), not just transient faults.
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)
}

func main() {
	http.HandleFunc("/rpc", rpcHandler)
	workers.Serve(nil) // Start the server via `github.com/syumai/workers`
}
