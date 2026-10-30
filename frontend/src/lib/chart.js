// Dört eşit aralıklı, "yuvarlak" eksen değeri: 109 -> 0/50/100/150/200
export function niceMax(max, ticks = 4) {
  if (max <= 0) return ticks
  const raw = max / ticks
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].find((m) => m * pow >= raw) * pow
  return Math.max(step, 1) * ticks
}
