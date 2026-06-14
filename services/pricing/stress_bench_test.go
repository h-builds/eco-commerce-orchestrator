package main

import (
	"fmt"
	"testing"
)

func BenchmarkStressCalculateDynamicPrice(b *testing.B) {
	// pre-generate args to avoid bench allocations
	const numArgs = 10000
	argsList := make([]PricingArgs, numArgs)
	for i := 0; i < numArgs; i++ {
		argsList[i] = PricingArgs{
			ProductID: fmt.Sprintf("prod-%d", i),
			BasePrice: float64(i) * 1.5,
			Stock:     i % 200,
		}
	}

	hour := int64(1700000000)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_ = CalculateDynamicPrice(argsList[i%numArgs], hour)
	}
}
