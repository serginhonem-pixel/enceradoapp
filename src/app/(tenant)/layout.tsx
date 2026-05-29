"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getUserTenant } from "@/lib/firestore";
import { TenantProvider } from "@/contexts/TenantProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "react-hot-toast";

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
        <main className="flex-1 flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </TenantProvider>
  );
}
