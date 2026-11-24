"use client"

import { setWorkspaceSharing } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useUpgradeDialog } from "@/components/UpgradeDialog";
import { useWorkspaceEditors } from "@/components/WorkspaceEditorsContext";
import { useFetch } from "@/hooks/use-fetch";
import { UPGRADE_REASONS } from "@/lib/plan-limits";
import { Copy, FileText, Lock, RotateCw, Shapes, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ExportKind = "doc" | "canvas";

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function ShareDialog({
    workspaceId,
    workspaceName,
    initialShareToken,
    canShare,
    canExportPdf,
}: {
    workspaceId: string;
    workspaceName: string;
    initialShareToken: string | null;
    canShare: boolean;
    canExportPdf: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [shareToken, setShareToken] = useState(initialShareToken);
    const [exporting, setExporting] = useState<ExportKind | null>(null);

    const { docEditor, canvasEditor } = useWorkspaceEditors();
    const openUpgrade = useUpgradeDialog();
    const { fn: setSharing, loading: sharingBusy } = useFetch(setWorkspaceSharing);

    // Close the Share dialog first so the upgrade dialog isn't stacked on top of it.
    const upgrade = (reason: keyof typeof UPGRADE_REASONS) => {
        setOpen(false);
        openUpgrade(UPGRADE_REASONS[reason]);
    };

    const updateSharing = async (enabled: boolean) => {
        if (enabled && !canShare) return upgrade("sharing");

        const result = await setSharing(workspaceId, enabled);
        if (!result) return;
        if ("limit" in result) return upgrade(result.limit);

        setShareToken(result.shareToken);
    };

    const shareUrl = shareToken
        ? `${window.location.origin}/shared/${shareToken}`
        : "";

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied");
        } catch {
            toast.error("Couldn't copy the link");
        }
    };

    const fileName = (suffix: string) =>
        `${workspaceName.trim().replace(/[\\/:*?"<>|]+/g, "-") || "workspace"}-${suffix}.pdf`;

    const exportDoc = async () => {
        if (!docEditor) return;

        // Loaded on click so the PDF libraries stay out of the workspace bundle.
        const [{ pdf }, { PDFExporter, pdfDefaultSchemaMappings }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@blocknote/xl-pdf-exporter/react-pdf"),
        ]);

        const exporter = new PDFExporter(docEditor.schema, pdfDefaultSchemaMappings);
        const document = await exporter.toReactPDFDocument(docEditor.document);
        downloadBlob(await pdf(document).toBlob(), fileName("doc"));
    };

    const exportCanvas = async () => {
        if (!canvasEditor) return;

        const shapeIds = [...canvasEditor.getCurrentPageShapeIds()];
        if (shapeIds.length === 0) {
            toast.error("The canvas is empty");
            return;
        }

        const [{ jsPDF }, image] = await Promise.all([
            import("jspdf"),
            // 2x pixels for a sharp image; width/height stay in the canvas's own units.
            canvasEditor.toImageDataUrl(shapeIds, {
                format: "png",
                pixelRatio: 2,
                background: true,
            }),
        ]);

        const { url, width, height } = image;
        // One page the same size as the canvas image.
        const pdf = new jsPDF({
            orientation: width >= height ? "landscape" : "portrait",
            unit: "px",
            format: [width, height],
            hotfixes: ["px_scaling"],
        });
        pdf.addImage(url, "PNG", 0, 0, width, height);
        pdf.save(fileName("canvas"));
    };

    const runExport = async (kind: ExportKind) => {
        if (!canExportPdf) return upgrade("pdfExport");

        setExporting(kind);
        try {
            await (kind === "doc" ? exportDoc() : exportCanvas());
        } catch (error) {
            console.error("[export]", error);
            toast.error("Export failed");
        } finally {
            setExporting(null);
        }
    };

    const exportButton = (kind: ExportKind, label: string, Icon: typeof FileText, editorOpen: boolean) => (
        <Button
            variant="outline"
            className="flex-1 gap-1.5"
            // Without the plan the button is a lock that opens the upgrade dialog, so only gate on the panel when it works.
            disabled={exporting !== null || (canExportPdf && !editorOpen)}
            title={canExportPdf && !editorOpen ? `Open the ${label.toLowerCase()} panel to export it` : undefined}
            onClick={() => runExport(kind)}
        >
            {canExportPdf ? <Icon className="size-4" /> : <Lock className="size-4" />}
            {exporting === kind ? "Exporting..." : label}
        </Button>
    );

    return (
        <>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
                <Share2 className="size-4" />
                Share
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share workspace</DialogTitle>
                        <DialogDescription>
                            Share a read-only link or export this workspace as PDF.
                        </DialogDescription>
                    </DialogHeader>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="flex items-center gap-1.5 font-medium">
                                    Public link
                                    {!canShare && <Lock className="size-3.5 text-muted-foreground" />}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Anyone with the link can view, not edit.
                                </p>
                            </div>
                            <Switch
                                checked={!!shareToken}
                                disabled={sharingBusy ?? false}
                                onCheckedChange={updateSharing}
                                aria-label="Public link"
                            />
                        </div>

                        {shareToken && (
                            <div className="flex items-center gap-2">
                                <Input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={copyLink}>
                                    <Copy className="size-4" />
                                    Copy
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5"
                                    disabled={sharingBusy ?? false}
                                    title="Create a new link. The old one stops working."
                                    onClick={() => updateSharing(true)}
                                >
                                    <RotateCw className="size-4" />
                                    Reset
                                </Button>
                            </div>
                        )}
                    </section>

                    <section className="space-y-3">
                        <p className="font-medium">Export as PDF</p>
                        <div className="flex gap-2">
                            {exportButton("doc", "Doc", FileText, !!docEditor)}
                            {exportButton("canvas", "Canvas", Shapes, !!canvasEditor)}
                        </div>
                    </section>
                </DialogContent>
            </Dialog>
        </>
    );
}
