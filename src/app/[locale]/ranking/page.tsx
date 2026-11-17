"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isGuestName, Profile, tierOf } from "@/lib/types";
import { useDisplayName } from "@/lib/useDisplayName";
import { TierIcon } from "@/components/Icons";

const SHOWN = 50;
// Guests can't be filtered in the query (Firestore has no pattern match), so
// read extra rows and drop them here; otherwise a lobby full of high-Elo
// guests would leave the board with fewer than 50 real players.
const FETCHED = 300;

export default function Ranking() {
  const t = useTranslations("ranking");
  const tTier = useTranslations("tiers");
  const dn = useDisplayName();
  const [rows, setRows] = useState<Profile[]>([]);
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "users"), orderBy("elo", "desc"), limit(FETCHED)),
        (s) =>
          setRows(
            s.docs
              .map((d) => d.data() as Profile)
              .filter((p) => !isGuestName(p.name))
              .slice(0, SHOWN),
          ),
      ),
    [],
  );
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">{t("title")}</h1>
      <table className="w-full text-left">
        <thead className="text-stone-400">
          <tr>
            <th>#</th>
            <th>{t("player")}</th>
            <th>{t("elo")}</th>
            <th>{t("wins")}</th>
            <th>{t("draws")}</th>
            <th>{t("losses")}</th>
            <th>{t("medal")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const tier = tierOf(p.karma ?? 0);
            return (
              <tr key={p.uid} className="border-t border-stone-700">
                <td className="py-2">{i + 1}</td>
                <td>{dn(p.name)}</td>
                <td className="font-bold text-amber-400">{p.elo}</td>
                <td>{p.wins}</td>
                <td>{p.draws}</td>
                <td>{p.losses}</td>
                <td>
                  <span className="inline-flex items-center gap-1.5">
                    <TierIcon name={tier.icon} className="shrink-0" />
                    {tTier(tier.key)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
