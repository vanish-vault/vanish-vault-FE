"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Save,
  CreditCard,
  Check,
  ArrowUpRight,
  Crown,
  Shield,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Card, Button, Input, Label } from "@/src/components/ui";
import { AnimatedSection } from "@/src/components/animation";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { updatePassword, updateName } from "@/src/services/auth";
import { getUserPlan, UserPlan } from "@/src/services/plans";
import { setUserName } from "@/src/store/auth/authSlice";

type Tab = "profile" | "password" | "plan";

const tabs = [
  { id: "profile" as Tab, label: "Profile", icon: User },
  { id: "password" as Tab, label: "Change Password", icon: Lock },
  { id: "plan" as Tab, label: "Plan & Billing", icon: CreditCard },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Profile state
  const [name, setName] = useState(user?.name || user?.username || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Plan state
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "plan") {
      loadUserPlan();
    }
  }, [activeTab]);

  const loadUserPlan = async () => {
    setIsPlanLoading(true);
    setPlanError(null);
    try {
      const data = await getUserPlan();
      setUserPlan(data);
    } catch (err: any) {
      setPlanError(err.message || "Failed to load plan information");
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateName(name.trim());
      dispatch(setUserName(name.trim()));
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsSavingPassword(true);
    try {
      await updatePassword({
        oldPassword: currentPassword || undefined,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const isPro =
    userPlan?.plan?.name?.toLowerCase().includes("pro") ||
    (userPlan?.maxFiles !== undefined && userPlan.maxFiles === -1) ||
    (userPlan?.plan?.maxSecrets !== undefined && userPlan.plan.maxSecrets === -1);

  const fileUsagePercent =
    userPlan && userPlan.maxFiles > 0
      ? Math.min(100, (userPlan.monthlyFileUploads / userPlan.maxFiles) * 100)
      : 0;

  // First day of next month
  const nextReset = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  })();

  return (
    <AnimatedSection className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and security settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-500 font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <AnimatedSection>
          <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50 max-w-2xl">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                  required
                  placeholder="Your display name"
                />
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={user?.username || ""}
                  className="mt-2"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Username cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  className="mt-2"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-2">
                  You cannot change your email address
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="submit"
                  className="gap-2 bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setName(user?.name || user?.username || "")
                  }
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </AnimatedSection>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <AnimatedSection>
          <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50 max-w-2xl">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-2"
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Leave blank if you signed up with Google (no password set)
                </p>
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2"
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2"
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="submit"
                  className="gap-2 bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  {isSavingPassword ? "Changing..." : "Change Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </AnimatedSection>
      )}

      {/* Plan Tab */}
      {activeTab === "plan" && (
        <AnimatedSection className="space-y-6">
          {isPlanLoading ? (
            <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50 max-w-2xl flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading plan details...
            </Card>
          ) : planError ? (
            <Card className="p-8 border-rose-500/30 bg-rose-500/5 max-w-2xl">
              <p className="text-rose-400 text-sm">{planError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={loadUserPlan}
              >
                Retry
              </Button>
            </Card>
          ) : (
            <>
              {/* Current Plan */}
              <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50 max-w-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      Current Plan
                    </h3>
                    <p className="text-muted-foreground">
                      Your active subscription details
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                      isPro
                        ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border-indigo-500/30"
                        : "bg-muted/40 border-border/50"
                    }`}
                  >
                    {isPro ? (
                      <Crown className="size-3.5 text-indigo-400" />
                    ) : (
                      <Shield className="size-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={`text-sm font-medium ${isPro ? "text-indigo-400" : "text-muted-foreground"}`}
                    >
                      {userPlan?.plan?.name || "Free"} Plan
                    </span>
                  </div>
                </div>

                {/* Plan price */}
                {userPlan?.plan && (
                  <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {userPlan.plan.price === 0
                          ? "Free"
                          : `₹${userPlan.plan.price}`}
                      </span>
                      {userPlan.plan.price > 0 && (
                        <span className="text-muted-foreground">
                          / {userPlan.plan.interval ?? "year"}
                        </span>
                      )}
                    </div>
                    {userPlan.plan.price > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed annually · Renews every{" "}
                        {userPlan.plan.interval ?? "year"}
                      </p>
                    )}
                  </div>
                )}

                {/* Plan features from API */}
                <div className="space-y-3 mb-6">
                  {(userPlan?.plan?.features ?? [
                    userPlan?.total === -1
                      ? "Unlimited active secrets"
                      : `${userPlan?.total ?? "—"} active secrets`,
                    userPlan?.maxFiles === -1
                      ? "Unlimited file uploads per month"
                      : `${userPlan?.maxFiles ?? "—"} file uploads per month`,
                    isPro
                      ? "Extended expiry (up to 30 days)"
                      : "Up to 24-hour expiration",
                    "AES-256 encryption",
                    "Password protection",
                  ]).map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check className="size-5 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {!isPro && (
                  <Button
                    onClick={() => router.push("/pricing")}
                    className="w-full gap-2 bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
                  >
                    Upgrade to Pro
                    <ArrowUpRight className="size-4" />
                  </Button>
                )}

                {isPro && (
                  <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-sm text-indigo-300 flex items-center gap-2">
                    <Crown className="size-4 shrink-0" />
                    You&apos;re on the Pro plan — enjoy unlimited access!
                  </div>
                )}
              </Card>

              {/* Billing Information — commented out intentionally */}
              {/* 
              <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50 max-w-2xl">
                <h3 className="text-xl font-semibold mb-1">Billing Information</h3>
                <p className="text-muted-foreground mb-6">No payment method on file</p>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro to add a payment method and unlock unlimited secrets, 
                    custom expiration times, and priority support.
                  </p>
                </div>
              </Card>
              */}

              {/* Usage Statistics — only for free plan */}
              {!isPro && userPlan && (
                <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50 max-w-2xl">
                  <h3 className="text-xl font-semibold mb-1">Usage This Month</h3>
                  <p className="text-muted-foreground mb-6">
                    Track your file upload and secret usage
                  </p>
                  <div className="space-y-5">
                    {/* File Uploads */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <Upload className="size-3.5 text-indigo-400" />
                          File Uploads
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {userPlan.monthlyFileUploads} / {userPlan.maxFiles}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            fileUsagePercent >= 90
                              ? "bg-rose-500"
                              : fileUsagePercent >= 70
                                ? "bg-amber-500"
                                : "bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)]"
                          }`}
                          style={{ width: `${fileUsagePercent}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      File upload count resets on {nextReset}
                    </p>
                  </div>
                </Card>
              )}
            </>
          )}
        </AnimatedSection>
      )}
    </AnimatedSection>
  );
}
