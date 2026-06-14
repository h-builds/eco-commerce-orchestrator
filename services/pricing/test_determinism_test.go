package main

import (
	"testing"
)

func TestDeterminismRepeated(t *testing.T) {
	args := PricingArgs{
		ProductID: "prod-123",
		BasePrice: 100.0,
		Stock:     50,
	}
	
	// Test if it's stable across different hours? No, it's supposed to change per hour.
	// But given the same inputs, is it stable?
	hour := int64(1700000000)
	res1 := CalculateDynamicPrice(args, hour)
	res2 := CalculateDynamicPrice(args, hour)
	if res1 != res2 {
		t.Errorf("Mismatch")
	}
}
