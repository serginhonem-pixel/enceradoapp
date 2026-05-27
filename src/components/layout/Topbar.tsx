"use client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Menu } from "lucide-react";

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export function Topbar({ title, onMenuClick, actions }: TopbarProps) {
  const { user } = useAuth();
  const { tenant } = useTenant();

  return (
    <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 className="font-heading font-semibold text-[0.95rem] text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold uppercase">
          {user?.email?.[0] ?? "U"}
        </div>
      </div>
    </header>
  );
}
