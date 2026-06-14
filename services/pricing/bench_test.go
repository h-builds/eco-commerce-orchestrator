package main

import (
	"strconv"
	"testing"
)

func fnv64a_stack(productID string, currentHour int64) uint64 {
	const offset64 = 14695981039346656037
	const prime64 = 1099511628211

	hash := uint64(offset64)
	for i := 0; i < len(productID); i++ {
		hash ^= uint64(productID[i])
		hash *= prime64
	}
	hash ^= uint64('-')
	hash *= prime64

	var buf [32]byte
	numBuf := strconv.AppendInt(buf[:0], currentHour, 10)
	for i := 0; i < len(numBuf); i++ {
		hash ^= uint64(numBuf[i])
		hash *= prime64
	}
	return hash
}

func BenchmarkFNVStack(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		fnv64a_stack("test-product-long-uuid-1234", 1700000000)
	}
}
