"use client";

import { useRouter } from "next/navigation";

const LogoutButton: React.FC = () => {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="border border-slate-200 px-4 py-3 rounded font-bold uppercase hover:bg-slate-50 transition-colors"
    >
      Đăng xuất
    </button>
  );
};

export default LogoutButton;