package main

import (
	"sync"
	"testing"
)

func TestDirectRace(t *testing.T) {
	numBuf := make([]byte, 32)
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			numBuf[0] = 1
		}
	}()
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			numBuf[0] = 2
		}
	}()
	wg.Wait()
}
