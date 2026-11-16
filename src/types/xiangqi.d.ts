declare module "xiangqi.js" {
  export type Color = "r" | "b";
  export interface Move { color: Color; from: string; to: string; piece: string; flags: string; iccs: string }
  export class Xiangqi {
    constructor(fen?: string);
    fen(): string; turn(): Color;
    moves(opts?: { verbose?: boolean; square?: string }): Move[];
    move(m: { from: string; to: string }): Move | null;
    undo(): Move | null;
    board(): ({ type: string; color: Color } | null)[][]; // row 0 = rank 9 (black side)
    game_over(): boolean; in_check(): boolean; in_checkmate(): boolean;
    in_stalemate(): boolean; in_draw(): boolean;
  }
}
