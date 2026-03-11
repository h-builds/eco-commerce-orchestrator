package main

import (
	"encoding/json"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/syumai/workers"
)

// JSONRPCRequest represents a standard JSON-RPC 2.0 request
type JSONRPCRequest struct दल
	JSONRPC string        `json:"jsonrpc"`
	Method  string        `json:"method"`
	Params  []PricingArgs `json:"params"`
	ID      interface{}   `json:"id"`
`

// PricingArgs are the arguments needed to calculate the dynamic price
type PricingArgs struct {
	ProductID string  `json:"product_id"`
	BasePrice float64 `json:"base_price"`
	Stock     int     `json:"stock"`
}

// JSONRPCResponse represents a standard JSON-RPC 2.0 response
type JSONRPCResponse struct {
	JSONRPC string        `json:"jsonrpc"`
	Result  PricingResult `json:"result,omitempty"`
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
	// For safety, let's assume the base cost is 40% of the original price (retail margin)
	// We'll enforce that the price cannot drop below this or go above 200%.
	baseCost := args.BasePrice * 0.4
	maxPrice := args.BasePrice * 2.0

	currentPrice := args.BasePrice
	confidence := 0.90 // Start with high confidence

	// 1. Scarcity Surcharge: If stock < 20, apply a 20% increase.
	if args.Stock < 20 {
		currentPrice = currentPrice * 1.20
		confidence += 0.05
	}

	// 2. Eco-Incentive Discount: If stock > 100, apply a 10% discount.
	if args.Stock > 100 {
		currentPrice = currentPrice * 0.90
		confidence += 0.05
	}

	// 3. Volatility: Use a time-based seed to simulate real-time market fluctuations.
	// Fluctuate randomly between -5% and +5%. For simulation, seed by minute to have stability within short windows
	// Or seed by current tick. Requirement: "time-based seed".
	seed := time.Now().UnixNano()
	r := rand.New(rand.NewSource(seed))
	
	// Random multiplier between 0.95 and 1.05
	volatilityMultiplier := 0.95 + r.Float64()*(1.05-0.95)
	currentPrice = currentPrice * volatilityMultiplier
	confidence -= r.Float64() * 0.1 // Uncertainty from volatility

	// 4. Guardrails (Safety & AI simulation)
	if currentPrice < baseCost {
		currentPrice = baseCost
		confidence += 0.1 // We are confident it shouldn't go lower
	}
	if currentPrice > maxPrice {
		currentPrice = maxPrice
		confidence += 0.1
	}

	// Clamp confidence between 0.0 and 1.0
	if confidence > 1.0 {
		confidence = 1.0
	} else if confidence < 0.0 {
		confidence = 0.0
	}

	// Round off to 2 decimal places
	roundedPrice := math.Round(currentPrice*100) / 100

	return PricingResult{
		ProductID:       args.ProductID,
		LivePrice:       roundedPrice,
		AgentConfidence: math.Round(confidence*100) / 100,
	}
}

func rpcHandler(w http.ResponseWriter, req *http.Request) {
	// Security: Expecting a dummy Bearer token or Internal secret header
	authHeader := req.Header.Get("Authorization")
	if authHeader != "Bearer eco-orchestrator-internal" {
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

	// Simulate pricing intelligence for the first param
	result := calculateDynamicPrice(rpcReq.Params[0])

	rpcRes := JSONRPCResponse{
		JSONRPC: "2.0",
		Result:  result,
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
	w.WriteHeader(http.StatusBadRequest) // Depending on the JSON-RPC spec, usually 200 or 400 for errors
	json.NewEncoder(w).Encode(res)
}

func main() {
	http.HandleFunc("/rpc", rpcHandler)
	workers.Serve(nil) // Start the server via `github.com/syumai/workers`
}
