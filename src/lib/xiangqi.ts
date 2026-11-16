// xiangqi.js ships a UMD file that ends with an AMD `define(...)` call. Under webpack that makes
// module.exports the constructor itself (no `.Xiangqi` property), while in plain Node it is
// `exports.Xiangqi`. Resolve whichever shape we get so every import site works in both.
import * as mod from "xiangqi.js";

type Ctor = typeof import("xiangqi.js").Xiangqi;
const m = mod as unknown as { Xiangqi?: Ctor; default?: Ctor | { Xiangqi?: Ctor } };
const resolved =
  m.Xiangqi ??
  (typeof m.default === "function" ? m.default : (m.default as { Xiangqi?: Ctor } | undefined)?.Xiangqi) ??
  (mod as unknown as Ctor);

export const Xiangqi: Ctor = resolved;
export type Xiangqi = InstanceType<Ctor>;
