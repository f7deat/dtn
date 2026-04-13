"use client";

import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "mobile";
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className, variant = "default" }) => {

  const onLogout = async () => {
    localStorage.removeItem("thp_token");
    window.location.reload();
  };

  const defaultStyle = "border border-slate-200 px-4 py-3 rounded font-bold uppercase hover:bg-slate-50 transition-colors";
  const mobileStyle = "flex items-center justify-center gap-2 border-2 border-red-600 text-red-600 px-4 py-3 rounded hover:bg-red-50 transition-colors font-bold w-full";

  return (
    <button
      type="button"
      onClick={onLogout}
      className={className || (variant === "mobile" ? mobileStyle : defaultStyle)}
    >
      {variant === "mobile" && <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />}
      Đăng xuất
    </button>
  );
};

export default LogoutButton;