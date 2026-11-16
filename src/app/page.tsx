"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { api, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Room } from "@/lib/types";

export default function Lobby() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState(""); const [password, setPassword] = useState("");
  const [side, setSide] = useState("random"); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, "rooms"), orderBy("createdAt", "desc"), limit(30)),
      (s) => setRooms(s.docs.map((d) => d.data() as Room)));
  }, [user]);

  const run = async (fn: () => Promise<{ code: string }>) => {
    setBusy(true); setErr("");
    try { router.push(`/room/${(await fn()).code}`); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  if (ready && !user) return <p>Hãy <Link className="text-amber-400 underline" href="/login">đăng nhập</Link> để thi đấu trực tuyến.</p>;

  return (
    <div className="grid gap-8 md:grid-cols-[320px_1fr]">
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Tạo phòng</h2>
        <input className="input" placeholder="Tên phòng" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Mật khẩu (tùy chọn)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select className="input" value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="random">Ngẫu nhiên</option><option value="red">Bên Đỏ</option><option value="black">Bên Đen</option>
        </select>
        <button className="btn w-full" disabled={busy} onClick={() => run(() => api("/api/rooms", { name, password, side }))}>Tạo phòng</button>
        <button className="btn-ghost w-full" disabled={busy} onClick={() => run(() => api("/api/match/find"))}>⚡ Ghép nhanh</button>
        {err && <p className="text-red-400">{err}</p>}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">Phòng đang mở</h2>
        <ul className="space-y-2">
          {rooms.map((r) => (
            <li key={r.code}>
              <Link href={`/room/${r.code}`} className="flex items-center justify-between rounded-lg bg-stone-800 px-4 py-3 hover:bg-stone-700">
                <span>{r.hasPass && "🔒 "}{r.name} <span className="text-stone-400">#{r.code}</span></span>
                <span className="text-sm text-stone-400">{r.status === "waiting" ? "Đang chờ" : r.status === "playing" ? "Đang đấu · xem" : "Đã kết thúc"}</span>
              </Link>
            </li>
          ))}
          {!rooms.length && <p className="text-stone-400">Chưa có phòng nào.</p>}
        </ul>
      </section>
    </div>
  );
}
