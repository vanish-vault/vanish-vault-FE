"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Lock,
  Eye,
  Clock,
  Printer,
  Download,
  AlertCircle,
  Copy,
  Check,
  FileIcon,
  Loader2,
} from "lucide-react";
import { Button, Card, Input, Label } from "@/src/components/ui";
import { toast } from "sonner";
import { checkSecret, getSecret } from "@/src/services/secrets";
import { decryptField } from "@/src/lib";
import {
  formatSeconds,
  copyToClipboard,
  formatFileSize,
  handlePrint,
  handleDownload,
  isPrintableFile,
} from "@/src/utils";
import { AnimatedSection } from "@/src/components/animation";

interface FileAttachment {
  id: string;
  filename: string;
  fileSize: number;
  contentType: string;
  originalFilename: string;
  fileFullPath: string;
  status: string;
  path: string;
}

// ── useSearchParams() MUST live inside a component wrapped with <Suspense> ──
function AccessLinkContent() {
  const { id } = useParams<{ id: string }>();
  const decryptionKey = useSearchParams().get("decryptionKey") || undefined;
  const router = useRouter();

  const [passwordEntered, setPasswordEntered] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [copiedText, setCopiedText] = useState(false);

  const [viewsRemaining, setViewsRemaining] = useState<number>(0);
  const [maxViews, setMaxViews] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);

  const timeRemaining = formatSeconds(secondsLeft);
  const [isNotFound, setIsNotFound] = useState(false);
  const isExpired = (expiresAt ? secondsLeft <= 0 : false) || isNotFound;

  useEffect(() => {
    if (!id || !decryptionKey) return;
    const fetchMeta = async () => {
      try {
        const meta = await checkSecret(id);
        setIsPasswordProtected(meta.isPasswordProtected);
        setViewsRemaining(meta.views);
        const exp = new Date(meta.expiresAt);
        setExpiresAt(exp);
        const diff = Math.floor((exp.getTime() - Date.now()) / 1000);
        setSecondsLeft(diff > 0 ? diff : 0);
      } catch (err: any) {
        if (err.status === 404) {
          setIsNotFound(true);
        } else {
          toast.error(err.message || "Unable to check secret");
        }
      }
    };
    fetchMeta();
  }, [id, decryptionKey]);

  useEffect(() => {
    if (isExpired) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired]);

  const handleUnlock = async () => {
    try {
      const encryptionKey = decryptionKey;
      if (!encryptionKey) throw new Error("Decryption key not available");

      const secretData = await getSecret(id!, passwordEntered || undefined);
      const secret = secretData.secret || undefined;
      const titleRaw = secretData.title || undefined;
      const filesRaw = secretData.files || [];

      setFiles(filesRaw);

      if (secret) {
        const decryptedContent = await decryptField(secret, encryptionKey, secretData.salt || "");
        setContent(decryptedContent);
      }
      if (titleRaw) {
        const decryptedTitle = await decryptField(titleRaw, encryptionKey, secretData.salt || "");
        setTitle(decryptedTitle);
      }
      setIsUnlocked(true);
      if (secretData.views != null) {
        setViewsRemaining(secretData.views);
        setMaxViews(secretData.maxViews);
      }
      toast.success("Access granted!");
    } catch (err: any) {
      if (err.status === 404) {
        setIsNotFound(true);
      } else {
        toast.error(err.message || "Failed to retrieve secret");
      }
    }
  };

  const copyTextContent = (data: string) => {
    copyToClipboard(data);
    setCopiedText(true);
    toast.success("Content copied to clipboard!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePrintFile = async (file: FileAttachment) => {
    if (!isPrintableFile(file)) {
      toast.error("This file type cannot be printed.");
      return;
    }
    await handlePrint(file);
    toast.success(`Printing ${file.filename}...`);
  };

  const handleDownloadFile = (file: FileAttachment) => {
    handleDownload(file);
    toast.success(`${file.originalFilename} downloaded!`);
  };

  if (isExpired) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center px-6">
        <Card className="p-12 max-w-md text-center border-destructive/50 bg-destructive/5">
          <div className="p-4 rounded-full bg-destructive/20 inline-block mb-6">
            <AlertCircle className="size-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Link Expired</h2>
          <p className="text-muted-foreground mb-6">
            This secure link has expired and is no longer accessible. The
            content has been permanently deleted.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/50">
            <div className="text-center mb-8">
              <div className="p-4 rounded-full bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] inline-block mb-4 shadow-lg shadow-indigo-500/25">
                <Lock className="size-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isPasswordProtected ? "Password Protected" : "Unlock Content"}
              </h2>
              <p className="text-muted-foreground">
                {isPasswordProtected
                  ? "Enter the password to access this secure content"
                  : `This content can only be viewed ${viewsRemaining} more time(s) and will expire in ${timeRemaining}.`}
              </p>
            </div>

            <div className="space-y-4">
              {isPasswordProtected && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={passwordEntered}
                    onChange={(e) => setPasswordEntered(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                    className="mt-2"
                    autoFocus
                  />
                </div>
              )}
              <Button
                className="w-full bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
                onClick={handleUnlock}
              >
                Unlock Content
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection className="mb-8">
          {/* Status Bar */}
          <Card className="p-4 border-border/50 backdrop-blur-sm bg-card/50 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                  <Clock className="size-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires in</p>
                  <p className="font-mono font-semibold">{timeRemaining}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <Eye className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Views remaining</p>
                  <p className="font-semibold">{viewsRemaining}/{maxViews}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <Shield className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Encryption</p>
                  <p className="font-semibold">AES-256</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Content Card */}
          <Card className="border-border/50 backdrop-blur-sm bg-card/50 overflow-hidden mb-6">
            <div className="p-6 border-b border-border/50 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] shadow-lg shadow-indigo-500/25">
                  <Shield className="size-5 text-white" />
                </div>
                <h3 className="font-semibold">{title ?? "Secure Message"}</h3>
              </div>
            </div>

            <div className="p-8">
              <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/30 p-6 rounded-lg border border-border/50">
                  {content}
                </pre>
              </div>

              <Button variant="outline" onClick={() => copyTextContent(content || "")} className="gap-2">
                {copiedText ? (
                  <><Check className="size-4" />Copied</>
                ) : (
                  <><Copy className="size-4" />Copy Text</>
                )}
              </Button>

              <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50 flex items-start gap-3">
                <AlertCircle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Security Notice</p>
                  <p>
                    This content will be permanently deleted after expiration or
                    when view limit is reached. Please save it securely if needed.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Files Section */}
          {files && files.length > 0 && (
            <Card className="border-border/50 backdrop-blur-sm bg-card/50 overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] shadow-lg shadow-indigo-500/25">
                    <FileIcon className="size-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Attached Files</h3>
                    <p className="text-sm text-muted-foreground">
                      {files.length} file{files.length !== 1 ? "s" : ""} attached
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
                        <FileIcon className="size-5 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.originalFilename}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file)} className="gap-2">
                          <Download className="size-4" />Download
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePrintFile(file)}
                          className="gap-2 bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
                        >
                          <Printer className="size-4" />Print
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Print watermark */}
          <div className="print:block hidden fixed inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold opacity-5 -rotate-45 whitespace-nowrap">
              VANISHVAULT SECURE DOCUMENT
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}

// Page shell — wraps content in Suspense so useSearchParams() is valid
export default function AccessLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading secure content...
          </div>
        </div>
      }
    >
      <AccessLinkContent />
    </Suspense>
  );
}
