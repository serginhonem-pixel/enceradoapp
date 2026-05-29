"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getUserTenant } from "@/lib/firestore";
import { TenantProvider } from "@/contexts/TenantProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, Users, Wrench, BarChart2, LogOut } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";

function getSlugFromUrl(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0];
  const p = new URLSearchParams(window.location.search);
  return p.get("tenant") ?? "";
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [slugLoading, setSlugLoading] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (!user) return;

    const urlSlug = getSlugFromUrl();
    if (urlSlug) {
      setSlug(urlSlug);
      setSlugLoading(false);
      return;
    }
    // busca o tenant do usuário no Firestore
    getUserTenant(user.uid).then((tenant) => {
      if (tenant) {
        setSlug(tenant.slug);
      } else {
        router.replace("/onboarding");
      }
      setSlugLoading(false);
    });
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <TenantProvider slug={slug}>
      <Toaster position="top-right" />
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar desktop */}
        <div className="hidden md:flex">
          <Sidebar onSignOut={handleSignOut} />
        </div>

        {/* Sidebar mobile */}
        {mobileSidebar && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
            <div className="relative z-50">
              <Sidebar onSignOut={handleSignOut} />
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom navigation mobile */}
      <BottomNav onSignOut={handleSignOut} />
    </TenantProvider>
  );
}

function BottomNav({ onSignOut }: { onSignOut: () => void }) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const isSub = typeof window !== "undefined" && window.location.hostname.split(".").length >= 3;
  const p = (path: string) => isSub ? path : `${path}?tenant=${tenant?.slug ?? ""}`;

  const items = [
    { href: "/dashboard",   icon: LayoutDashboard, label: "Início" },
    { href: "/atendimentos", icon: ClipboardList,  label: "OS" },
    { href: "/clientes",    icon: Users,           label: "Clientes" },
    { href: "/servicos",    icon: Wrench,          label: "Serviços" },
    { href: "/relatorios",  icon: BarChart2,       label: "Mais" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink border-t border-white/10 flex">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={p(href)} className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition ${active ? "text-brand" : "text-white/40 hover:text-white/70"}`}>
            <Icon size={20} />
            <span className="text-[0.6rem] font-medium">{label}</span>
          </Link>
        );
      })}
      <button onClick={onSignOut} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-white/40 hover:text-red-400 transition">
        <LogOut size={20} />
        <span className="text-[0.6rem] font-medium">Sair</span>
      </button>
    </nav>
  );
}

