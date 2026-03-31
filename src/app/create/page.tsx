"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { incrementFileUpload } from "@/src/store/auth/authSlice";
import {
  Shield,
  Copy,
  Check,
  Upload,
  FileIcon,
  Eye,
  X,
  Crown,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createSecret } from "@/src/services/secrets";
import { getUploadSignedUrl, uploadFileToSignedUrl } from "@/src/services/file";
import { getUserPlan, UserPlan } from "@/src/services/plans";

import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { copyToClipboard } from "@/src/utils";
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui";
import { AnimatedSection } from "@/src/components/animation";
import { encrypt, generateEncryptionKey, generateSalt } from "@/src/lib";
import Link from "next/link";

// All possible expiry options
const ALL_EXPIRY_OPTIONS = [
  { value: "1h", label: "1 hour", hours: 1 },
  { value: "6h", label: "6 hours", hours: 6 },
  { value: "24h", label: "24 hours", hours: 24 },
  { value: "7d", label: "7 days", hours: 24 * 7 },
  { value: "30d", label: "30 days", hours: 24 * 30 },
];

// Free plan max expiry = 24h
const FREE_MAX_EXPIRY_HOURS = 24;

// Fallback file limits
const FREE_MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const PRO_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
  url?: string;
  serverId?: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function parseExpiry(value: string): number {
  const option = ALL_EXPIRY_OPTIONS.find((o) => o.value === value);
  return option ? option.hours * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export default function CreateLinkPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, router]);

  // ── Plan data ──────────────────────────────────────────────
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    try {
      const data = await getUserPlan();
      setUserPlan(data);
    } catch {
      // Fail silently – we apply conservative (free) limits as fallback
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadPlan();
  }, [isAuthenticated, loadPlan]);

  // ── Derived plan constraints ───────────────────────────────
  const isPro =
    userPlan?.maxFiles === -1 ||
    userPlan?.plan?.name?.toLowerCase().includes("pro") ||
    false;

  const maxFiles = isPro ? Infinity : (userPlan?.maxFiles ?? 3);
  const monthlyUploads = userPlan?.monthlyFileUploads ?? 0;
  // maxFileSize is now on plan object (bytes)
  const maxFileSize =
    userPlan?.plan?.maxFileSize ??
    (isPro ? PRO_MAX_FILE_SIZE : FREE_MAX_FILE_SIZE);

  // maxExpiry is now in seconds on plan object — convert to hours
  const maxExpiryHours = userPlan?.plan?.maxExpiry
    ? userPlan.plan.maxExpiry / 3600
    : isPro
      ? 24 * 30
      : FREE_MAX_EXPIRY_HOURS;
  const availableExpiryOptions = ALL_EXPIRY_OPTIONS.filter(
    (o) => o.hours <= maxExpiryHours,
  );

  // maxViews is now on plan object. -1 = unlimited
  const rawMaxViews = userPlan?.plan?.maxViews ?? (isPro ? -1 : 10);
  const maxViewLimit = rawMaxViews === -1 ? 999999 : rawMaxViews;

  // ── Form state ─────────────────────────────────────────────
  const [textContent, setTextContent] = useState("");
  const [expiry, setExpiry] = useState("24h");
  const [viewLimit, setViewLimit] = useState("1");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Clamp expiry to allowed options when plan loads
  useEffect(() => {
    if (!isPro && expiry !== "1h" && expiry !== "6h" && expiry !== "24h") {
      setExpiry("24h");
    }
  }, [isPro, expiry]);

  // ── File upload ────────────────────────────────────────────
  const filesUploadedSoFar = monthlyUploads + uploadedFiles.length;
  const filesRemaining =
    maxFiles === Infinity ? Infinity : maxFiles - filesUploadedSoFar;
  const fileQuotaExceeded = maxFiles !== Infinity && filesRemaining <= 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Quota check
    if (
      maxFiles !== Infinity &&
      uploadedFiles.length + files.length + monthlyUploads > maxFiles
    ) {
      toast.error(
        `You have ${Math.max(0, filesRemaining)} file upload${filesRemaining === 1 ? "" : "s"} remaining this month on your current plan.`,
      );
      e.target.value = "";
      return;
    }

    // Size check
    const oversized = files.filter((f) => f.size > maxFileSize);
    if (oversized.length > 0) {
      toast.error(
        `File size exceeds ${formatFileSize(maxFileSize)} limit for ${isPro ? "Pro" : "Free"} plan`,
      );
      e.target.value = "";
      return;
    }

    const newFiles: UploadedFile[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 15),
      file,
      progress: 0,
      status: "uploading",
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";

    newFiles.forEach(async (uploadedFile) => {
      try {
        const data = await getUploadSignedUrl(
          uploadedFile.file.name,
          uploadedFile.file.type,
          uploadedFile.file.size,
        );
        const { signedUrl, id } = data;

        await uploadFileToSignedUrl(signedUrl, uploadedFile.file);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  progress: 100,
                  status: "complete",
                  serverId: id,
                  url: URL.createObjectURL(f.file),
                }
              : f,
          ),
        );
        toast.success(`${uploadedFile.file.name} uploaded`);
        dispatch(incrementFileUpload());
      } catch (err: any) {
        const errMsg: string = err.message || "Upload failed";
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: "error" } : f,
          ),
        );
        // 403 = quota reached on the backend
        if (errMsg.toLowerCase().includes("limit") || err.status === 403) {
          toast.error(`File quota reached: ${errMsg}`);
        } else {
          toast.error(errMsg);
        }
      }
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // ── Generate link ──────────────────────────────────────────
  const generateLink = async () => {
    if (isLoading) return;

    const hasText = textContent.trim().length > 0;
    const completedFiles = uploadedFiles.filter((f) => f.status === "complete");

    if (!hasText && completedFiles.length === 0) {
      toast.error("Please add some text or upload at least one file");
      return;
    }

    const views = Number(viewLimit) || 1;
    if (views < 1 || views > maxViewLimit) {
      toast.error(
        `View limit must be between 1 and ${maxViewLimit} for your plan`,
      );
      return;
    }

    setIsLoading(true);
    try {
      const encryptionKey = generateEncryptionKey();
      const salt = generateSalt();

      const encryptedSecret = await encrypt(
        textContent || " ",
        encryptionKey,
        salt,
      );
      const encryptedTitle = await encrypt(title || " ", encryptionKey, salt);

      const payload: any = {
        secret: encryptedSecret,
        title: encryptedTitle,
        salt,
        views,
        isBurnable: false,
        expiresAt: new Date(Date.now() + parseExpiry(expiry)).toISOString(),
      };

      if (password) payload.password = password;

      const fileIds = completedFiles
        .map((f) => f.serverId)
        .filter(Boolean) as string[];
      if (fileIds.length) payload.files = fileIds;

      const data = await createSecret(payload);
      const link = `${window.location.origin}/link/${data.id}?decryptionKey=${encryptionKey}`;
      setGeneratedLink(link);
      toast.success("Secure link generated!");
    } catch (err: any) {
      // Parse structured BE errors
      const message: string = err.message || "Failed to create secret";
      const details: string[] | undefined = err.details;

      if (details && details.length > 0) {
        // Show first validation error prominently, rest as additional toasts
        toast.error(details[0]);
        details.slice(1).forEach((d) => toast.error(d));
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    copyToClipboard(generatedLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryLabel =
    ALL_EXPIRY_OPTIONS.find((o) => o.value === expiry)?.label ?? expiry;

  // ── Loading plan skeleton ──────────────────────────────────
  if (planLoading) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading your plan...
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Create Secure Link
          </h1>
          <p className="text-lg text-muted-foreground">
            Share sensitive information with military-grade encryption
          </p>
        </AnimatedSection>

        {!generatedLink ? (
          <AnimatedSection delay={0.1}>
            <Card className="border-border/50 backdrop-blur-sm bg-card/50 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-border/50 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] shadow-lg shadow-indigo-500/25">
                    <Shield className="size-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">End-to-End Encrypted</h3>
                    <p className="text-sm text-muted-foreground">
                      Your data is encrypted before leaving your device
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Plan Info Banner */}
                <div
                  className={`p-4 rounded-lg border ${
                    isPro
                      ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30"
                      : "bg-muted/30 border-border/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold mb-1 flex items-center gap-2">
                        {isPro ? (
                          <Crown className="size-4 text-indigo-400" />
                        ) : (
                          <Shield className="size-4 text-muted-foreground" />
                        )}
                        {isPro ? "Pro Plan" : "Free Plan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isPro
                          ? `Unlimited file uploads · Max file size: ${formatFileSize(maxFileSize)} · Extended expiry up to ${maxExpiryHours >= 24 ? maxExpiryHours / 24 + " days" : maxExpiryHours + "h"}`
                          : `${Math.max(0, filesRemaining)} of ${maxFiles} file uploads remaining this month · Max file size: ${formatFileSize(maxFileSize)} · Expiry up to ${maxExpiryHours >= 24 ? maxExpiryHours / 24 + " days" : maxExpiryHours + "h"}`}
                      </p>
                    </div>
                    {!isPro && filesRemaining <= 1 && (
                      <Link href="/pricing">
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                        >
                          Upgrade
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter a title for your secure link"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 bg-background"
                  />
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="text-content">Your Message (Optional)</Label>
                  <Textarea
                    id="text-content"
                    placeholder="Enter sensitive text, credentials, or any information you want to share securely..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="min-h-[150px] mt-2 bg-input-background border-border/50"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label>
                    File Upload
                    {!isPro && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({Math.max(0, filesRemaining)} remaining this month)
                      </span>
                    )}
                  </Label>
                  <div className="mt-2 space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        fileQuotaExceeded
                          ? "border-rose-500/30 bg-rose-500/5 opacity-60 cursor-not-allowed"
                          : "border-border/50 hover:border-indigo-500/50"
                      }`}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        multiple
                        disabled={fileQuotaExceeded}
                      />
                      <label
                        htmlFor="file-upload"
                        className={
                          fileQuotaExceeded
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        }
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10">
                            {fileQuotaExceeded ? (
                              <AlertTriangle className="size-8 text-rose-400" />
                            ) : (
                              <Upload className="size-8 text-indigo-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {fileQuotaExceeded
                                ? "Monthly file upload limit reached"
                                : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {fileQuotaExceeded
                                ? "Upgrade to Pro for unlimited uploads"
                                : `Any file up to ${formatFileSize(maxFileSize)}`}
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {fileQuotaExceeded && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <p className="text-sm text-rose-400">
                          You&apos;ve used all {maxFiles} file uploads for this
                          month. Resets on the 1st.
                        </p>
                        <Link href="/pricing">
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 border-rose-500/30 text-rose-400 hover:text-rose-300"
                          >
                            Upgrade
                          </Button>
                        </Link>
                      </div>
                    )}

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3">
                        {uploadedFiles.map((uploadedFile) => (
                          <div
                            key={uploadedFile.id}
                            className="p-4 rounded-lg border border-border/50 bg-muted/20"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
                                <FileIcon className="size-5 text-indigo-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {uploadedFile.file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(uploadedFile.file.size)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {uploadedFile.status === "complete" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          uploadedFile.url &&
                                          window.open(
                                            uploadedFile.url,
                                            "_blank",
                                          )
                                        }
                                        className="h-8 gap-1.5"
                                      >
                                        <Eye className="size-3.5" />
                                        View
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        removeFile(uploadedFile.id)
                                      }
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="size-4" />
                                    </Button>
                                  </div>
                                </div>
                                {uploadedFile.status === "uploading" && (
                                  <div className="space-y-1">
                                    <Progress
                                      value={uploadedFile.progress}
                                      className="h-1.5"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Uploading...
                                    </p>
                                  </div>
                                )}
                                {uploadedFile.status === "complete" && (
                                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                                    <Check className="size-3.5" />
                                    <p className="text-xs">Upload complete</p>
                                  </div>
                                )}
                                {uploadedFile.status === "error" && (
                                  <div className="flex items-center gap-1.5 text-rose-500">
                                    <AlertTriangle className="size-3.5" />
                                    <p className="text-xs">Upload failed</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-4 p-6 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="size-4 text-indigo-500" />
                    Security Settings
                  </h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Expiry */}
                    <div>
                      <Label htmlFor="expiry">
                        Expiry Time
                        {!isPro && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (max 24h on Free)
                          </span>
                        )}
                      </Label>
                      <Select value={expiry} onValueChange={setExpiry}>
                        <SelectTrigger
                          id="expiry"
                          className="mt-2 bg-background"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableExpiryOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                          {!isPro && (
                            <div className="px-3 py-2 border-t border-border/50">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Crown className="size-3 text-indigo-400" />
                                Upgrade for 7-day and 30-day expiry
                              </p>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* View Limit */}
                    <div>
                      <Label htmlFor="view-limit">
                        View Limit
                        {maxViewLimit < 9999 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (max {maxViewLimit})
                          </span>
                        )}
                      </Label>
                      <Input
                        id="view-limit"
                        type="number"
                        placeholder="e.g., 5"
                        min="1"
                        max={maxViewLimit}
                        value={viewLimit}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!isPro && v > maxViewLimit) {
                            setViewLimit(String(maxViewLimit));
                          } else {
                            setViewLimit(e.target.value);
                          }
                        }}
                        className="mt-2 bg-background"
                      />
                      {maxViewLimit < 9999 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Max allowable for your plan: {maxViewLimit} views
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <Label
                      htmlFor="password"
                      className="flex items-center gap-2"
                    >
                      <Lock className="size-3.5 text-indigo-400" />
                      Password Protection (Optional)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a password to add extra security"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-2 bg-background"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25"
                  onClick={generateLink}
                  disabled={
                    isLoading ||
                    (!textContent.trim() &&
                      uploadedFiles.filter((f) => f.status === "complete")
                        .length === 0)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Shield className="size-4 mr-2" />
                      Generate Secure Link
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </AnimatedSection>
        ) : (
          <AnimatedSection animate="scale" className="space-y-6">
            <Card className="p-8 border-2 border-green-500/50 bg-gradient-to-br from-green-500/5 via-green-500/5 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-green-500/20">
                  <Check className="size-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    Link Generated Successfully!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your secure link is ready to share
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Your Secure Link</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="bg-background font-mono text-sm"
                    />
                    <Button size="icon" onClick={copyLink} className="shrink-0">
                      {copied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 pt-6">
                  <div className="flex-1">
                    <Label>QR Code</Label>
                    <div className="mt-2 p-4 bg-white rounded-lg inline-block">
                      <QRCodeSVG value={generatedLink} size={150} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <Label>Link Status</Label>
                    <div className="mt-2 space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">
                          Expires in
                        </span>
                        <span className="font-semibold">{expiryLabel}</span>
                      </div>
                      {uploadedFiles.filter((f) => f.status === "complete")
                        .length > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">
                            Files attached
                          </span>
                          <span className="font-semibold">
                            {
                              uploadedFiles.filter(
                                (f) => f.status === "complete",
                              ).length
                            }
                          </span>
                        </div>
                      )}
                      {viewLimit && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">
                            View limit
                          </span>
                          <span className="font-semibold">
                            {viewLimit} views
                          </span>
                        </div>
                      )}
                      {password && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-muted-foreground">
                            Password
                          </span>
                          <span className="font-semibold">Protected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => {
                  setGeneratedLink("");
                  setTextContent("");
                  setUploadedFiles([]);
                  setViewLimit("1");
                  setPassword("");
                  setTitle("");
                }}
              >
                Create Another Link
              </Button>
            </Card>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
