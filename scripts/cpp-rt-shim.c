// Minimal compiler-rt/libgcc soft-float helpers missing from the vendored
// wasm-clang sysroot (its libc++.a references __lttf2 etc. for long double
// support). Implemented with pure i64 arithmetic so no compiler-rt is needed.
//
// IEEE-754 binary128 ("long double"): sign(1) exponent(15) fraction(112).
// Return values follow LLVM compiler-rt conventions (boolean).
typedef unsigned long long u64;

static int cmptf(u64 hiA, u64 loA, u64 hiB, u64 loB) {
  int sA = (int)(hiA >> 63), sB = (int)(hiB >> 63);
  int eA = (int)((hiA >> 48) & 0x7fff), eB = (int)((hiB >> 48) & 0x7fff);
  u64 fAhi = hiA & 0x0000ffffffffffffULL, fBhi = hiB & 0x0000ffffffffffffULL;

  if (eA == 0x7fff && (fAhi || loA)) return 1;  // a is NaN -> greater
  if (eB == 0x7fff && (fBhi || loB)) return -1; // b is NaN -> less

  if (sA != sB) return sA ? -1 : 1;

  int c = 0;
  if (hiA != hiB) c = hiA < hiB ? -1 : 1;
  else if (loA != loB) c = loA < loB ? -1 : 1;
  return sA ? -c : c;
}

int __eqtf2(u64 a1, u64 a0, u64 b1, u64 b0) { return cmptf(a1, a0, b1, b0) == 0; }
int __netf2(u64 a1, u64 a0, u64 b1, u64 b0) { return cmptf(a1, a0, b1, b0) != 0; }
int __lttf2(u64 a1, u64 a0, u64 b1, u64 b0) { return cmptf(a1, a0, b1, b0) < 0; }
int __gttf2(u64 a1, u64 a0, u64 b1, u64 b0) { return cmptf(a1, a0, b1, b0) > 0; }
int __letf2(u64 a1, u64 a0, u64 b1, u64 b0) { return cmptf(a1, a0, b1, b0) <= 0; }
int __getf2(u64 a1, u64 a0, u64 b1, u64 b0) { return cmptf(a1, a0, b1, b0) >= 0; }