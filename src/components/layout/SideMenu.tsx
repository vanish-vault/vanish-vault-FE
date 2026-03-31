"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Key, User, LogOut, Mail } from "lucide-react";
import { Button } from "@/src/components/ui";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { signOut } from "@/src/store/auth/authSlice";
import { toast } from "sonner";

const menuItems = [
  { path: "/dashboard/secrets", label: "Secrets", icon: Key },
  { path: "/dashboard/account", label: "Account", icon: User },
];

export function SideMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleSignOut = () => {
    dispatch(signOut());
    toast.success("Signed out successfully");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen pt-20">
      {/* Side Navigation */}
      <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-sm fixed left-0 top-20 bottom-0 hidden md:block">
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] shadow-lg shadow-indigo-500/25">
                <Shield className="size-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" suppressHydrationWarning>
                  {user?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate" suppressHydrationWarning>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 text-indigo-500 font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-border/50">
            <div className="mb-3 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="size-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Email</p>
              </div>
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
