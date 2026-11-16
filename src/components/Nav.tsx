"use client";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

export default function Nav() {
  const { user } = useAuth();
  return (
    <nav className="flex items-center gap-5 border-b border-stone-700 px-6 py-3">
      <Link href="/" className="text-lg font-bold text-amber-400">♟ Cờ Tướng</Link>
      <Link href="/play-ai" className="hover:text-amber-300">Chơi với máy</Link>
      <Link href="/ranking" className="hover:text-amber-300">Xếp hạng</Link>
      <div className="ml-auto flex items-center gap-3">
        {user ? (<>
          <span className="text-sm text-stone-300">{user.displayName || user.email}</span>
          <button className="btn-ghost" onClick={() => signOut(auth)}>Đăng xuất</button>
        </>) : <Link className="btn" href="/login">Đăng nhập</Link>}
      </div>
    </nav>
  );
}
