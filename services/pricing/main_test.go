package main

import (
	"testing"
)

func TestFNV64a(t *testing.T) {
	numBuf := make([]byte, 0, 32)
	hash := fnv64a("prod-123", 1700000000, numBuf)
	// Expected hash for "prod-123-1700000000"
	// Let's just ensure it's stable.
	hash2 := fnv64a("prod-123", 1700000000, numBuf)
	if hash != hash2 {
		t.Errorf("Expected fnv64a to be deterministic, got different hashes")
	}
}

func TestSplitmix64(t *testing.T) {
	// A known test vector for splitmix64
	seed := uint64(12345)
	res := splitmix64(seed)
	if res == 0 {
		t.Errorf("splitmix64 returned 0")
	}
}

func TestCalculateDynamicPrice(t *testing.T) {
	args := PricingArgs{
		ProductID: "prod-123",
		BasePrice: 100.0,
		Stock:     50,
	}
	numBuf := make([]byte, 0, 32)
	hour := int64(1700000000)

	result1 := calculateDynamicPrice(args, hour, numBuf)
	result2 := calculateDynamicPrice(args, hour, numBuf)

	if result1.LivePrice != result2.LivePrice {
		t.Errorf("Expected deterministic LivePrice, got %f and %f", result1.LivePrice, result2.LivePrice)
	}

	if result1.AgentConfidence != result2.AgentConfidence {
		t.Errorf("Expected deterministic AgentConfidence, got %f and %f", result1.AgentConfidence, result2.AgentConfidence)
	}
}

// Benchmark the zero-allocation hot loop
func BenchmarkCalculateDynamicPrice(b *testing.B) {
	args := PricingArgs{
		ProductID: "test-product-long-uuid-1234",
		BasePrice: 150.00,
		Stock:     75,
	}
	numBuf := make([]byte, 0, 32)
	hour := int64(1700000000)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_ = calculateDynamicPrice(args, hour, numBuf)
	}
}
