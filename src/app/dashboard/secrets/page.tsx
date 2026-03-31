"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Trash2, Clock, Eye, Plus } from "lucide-react";
import { Card, Button } from "@/src/components/ui";
import { AnimatedSection } from "@/src/components/animation";
import { toast } from "sonner";
import { formatDate } from "@/src/utils";
import { listSecrets, deleteSecret } from "@/src/services/secrets";

interface Secret {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  viewsLeft: number;
  maxViews: number;
}

const ITEMS_PER_PAGE = 10;

function formatCountdown(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActive, setTotalActive] = useState(0);
  const [timers, setTimers] = useState<Record<string, string>>({});
  const router = useRouter();

  const loadSecrets = async (page: number) => {
    try {
      const res = await listSecrets(page, ITEMS_PER_PAGE);
      setTotalPages(res.totalPages);
      const mapped = res.secrets.map((s) => ({
        id: s.id,
        createdAt: new Date(s.createdAt),
        expiresAt: new Date(s.expiresAt),
        viewsLeft: s.views,
        maxViews: s.views,
      }));
      setSecrets(mapped);
    } catch (err: any) {
      toast.error(err.message || "Failed to load secrets");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSecrets = async () => {
      try {
        const res = await listSecrets(currentPage, ITEMS_PER_PAGE);
        if (!isMounted) return;
        setTotalPages(res.totalPages);
        setTotalActive(res.totalActive);
        const mapped = res.secrets.map((s) => ({
          id: s.id,
          createdAt: new Date(s.createdAt),
          expiresAt: new Date(s.expiresAt),
          viewsLeft: s.views,
          maxViews: s.maxViews,
        }));
        setSecrets(mapped);
      } catch (err: any) {
        toast.error(err.message || "Failed to load secrets");
      }
    };
    fetchSecrets();
    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const activeSecrets = secrets; // Assuming backend returns only active
  const paginatedSecrets = activeSecrets;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(
        Object.fromEntries(
          paginatedSecrets.map((s) => [s.id, formatCountdown(s.expiresAt)]),
        ),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [paginatedSecrets]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSecret(id);
      toast.success("Secret deleted successfully");
      // reload current page
      loadSecrets(currentPage);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete secret");
    }
  };

  return (
    <AnimatedSection className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Secrets</h1>
          <p className="text-muted-foreground">
            Manage your active encrypted secrets
          </p>
        </div>
        <Button
          onClick={() => router.push("/create")}
          className="gap-2 bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Create New Secret
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/50">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <Key className="size-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Total Active Secrets
            </p>
            <p className="text-3xl font-bold">{totalActive}</p>
          </div>
        </div>
      </Card>

      {/* Secrets Table */}
      <Card className="border-border/50 backdrop-blur-sm bg-card/50 overflow-hidden">
        {activeSecrets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
              <Key className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No active secrets</h3>
            <p className="text-muted-foreground mb-6">
              Create your first secret to get started
            </p>
            <Button
              onClick={() => router.push("/create")}
              className="gap-2 bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white hover:opacity-90"
            >
              <Plus className="size-4" />
              Create Secret
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border/50">
                  <tr>
                    {[
                      "Secret ID",
                      "Created At",
                      "Expires In",
                      "Views Left",
                      "Actions",
                    ].map((heading, i) => (
                      <th
                        key={heading}
                        className={`px-6 py-4 font-semibold text-sm ${
                          i === 4 ? "text-right" : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedSecrets.map((secret, index) => (
                    <AnimatedSection
                      key={secret.id}
                      delay={index * 0.05}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      as="tr"
                    >
                      <td className="px-6 py-4">
                        <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                          {secret.id}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(secret.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-indigo-500" />
                          <span className="font-mono text-sm font-medium">
                            {timers[secret.id] || "00:00:00"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Eye className="size-4 text-green-500" />
                          <span className="text-sm font-medium">
                            {secret.viewsLeft} / {secret.maxViews}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(secret.id)}
                          className="gap-2 text-destructive hover:text-destructive hover:border-destructive/50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </AnimatedSection>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border/50 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalActive)} of{" "}
                  {totalActive} secrets
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-gradient-to-r from-[var(--gradient-from)] via-[var(--gradient-via)] to-[var(--gradient-to)] text-white"
                              : ""
                          }
                        >
                          {page}
                        </Button>
                      ),
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </AnimatedSection>
  );
}
