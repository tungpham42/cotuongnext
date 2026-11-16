"use client";
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Profile, tierOf } from "@/lib/types";

export default function Ranking() {
  const [rows, setRows] = useState<Profile[]>([]);
  useEffect(() => onSnapshot(query(collection(db, "users"), orderBy("elo", "desc"), limit(50)),
    (s) => setRows(s.docs.map((d) => d.data() as Profile))), []);
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Bảng xếp hạng Elo</h1>
      <table className="w-full text-left">
        <thead className="text-stone-400"><tr><th>#</th><th>Kỳ thủ</th><th>Elo</th><th>Thắng</th><th>Hòa</th><th>Thua</th><th>Huân chương</th></tr></thead>
        <tbody>
          {rows.map((p, i) => { const t = tierOf(p.karma ?? 0); return (
            <tr key={p.uid} className="border-t border-stone-700">
              <td className="py-2">{i + 1}</td><td>{p.name}</td><td className="font-bold text-amber-400">{p.elo}</td>
              <td>{p.wins}</td><td>{p.draws}</td><td>{p.losses}</td><td>{t.icon} {t.name}</td>
            </tr>); })}
        </tbody>
      </table>
    </>
  );
}
