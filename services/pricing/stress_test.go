package main

import (
	"fmt"
	"math/rand"
	"sync"
	"testing"
	"time"
)

func TestStressDeterminism(t *testing.T) {
	rand.Seed(time.Now().UnixNano())
	type testCase struct {
		args PricingArgs
		hour int64
	}

	var cases []testCase
	for i := 0; i < 1000; i++ {
		cases = append(cases, testCase{
			args: PricingArgs{
				ProductID: fmt.Sprintf("prod-%d-%d", rand.Int(), rand.Int()),
				BasePrice: rand.Float64() * 1000,
				Stock:     rand.Intn(200),
			},
			hour: rand.Int63n(10000000000),
		})
	}

	results := make([]PricingResult, len(cases))
	for i, c := range cases {
		results[i] = CalculateDynamicPrice(c.args, c.hour)
	}

	// Now run from multiple goroutines concurrently to ensure determinism and no races
	var wg sync.WaitGroup
	for w := 0; w < 10; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i, c := range cases {
				res := CalculateDynamicPrice(c.args, c.hour)
				if res != results[i] {
					t.Errorf("Determinism failure at case %d: expected %+v, got %+v", i, results[i], res)
				}
			}
		}()
	}
	wg.Wait()
}
