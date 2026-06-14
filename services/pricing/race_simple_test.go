package main

import (
	"strconv"
	"sync"
	"testing"
)

func TestSimpleRace(t *testing.T) {
	numBuf := make([]byte, 0, 32)
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			strconv.AppendInt(numBuf[:0], 1, 10)
		}
	}()
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			strconv.AppendInt(numBuf[:0], 2, 10)
		}
	}()
	wg.Wait()
}
