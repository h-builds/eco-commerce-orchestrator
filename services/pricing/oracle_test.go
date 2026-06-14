package main

import (
	"math"
	"math/rand"
	"strconv"
	"testing"
)

func TestDeterminismOracle(t *testing.T) {
	for i := 0; i < 10000; i++ {
		args := PricingArgs{
			ProductID: "prod-" + strconv.Itoa(rand.Intn(10000)),
			BasePrice: rand.Float64() * 1000,
			Stock:     rand.Intn(200),
		}
		hour := int64(1700000000 + rand.Intn(1000))

		res1 := CalculateDynamicPrice(args, hour)
		res2 := CalculateDynamicPrice(args, hour)

		if res1.ProductID != res2.ProductID {
			t.Fatalf("ProductID mismatch: %v != %v", res1.ProductID, res2.ProductID)
		}

		if math.IsNaN(res1.LivePrice) && math.IsNaN(res2.LivePrice) {
			// both NaN, ok
		} else if res1.LivePrice != res2.LivePrice {
			t.Fatalf("LivePrice mismatch: %v != %v for args %+v, hour %d", res1.LivePrice, res2.LivePrice, args, hour)
		}

		if math.IsNaN(res1.AgentConfidence) && math.IsNaN(res2.AgentConfidence) {
			// both NaN, ok
		} else if res1.AgentConfidence != res2.AgentConfidence {
			t.Fatalf("AgentConfidence mismatch: %v != %v for args %+v, hour %d", res1.AgentConfidence, res2.AgentConfidence, args, hour)
		}
	}
}
