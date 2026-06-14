package main

import (
	"sync"
	"testing"
)

func TestRaceCalculateDynamicPrice(t *testing.T) {
	args := PricingArgs{
		ProductID: "prod-123",
		BasePrice: 100.0,
		Stock:     50,
	}
	hour := int64(1700000000)

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				_ = CalculateDynamicPrice(args, hour)
			}
		}()
	}
	wg.Wait()
}
