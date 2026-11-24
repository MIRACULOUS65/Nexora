import { Badge } from "@/components/ui/badge";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DocViewer } from "@/components/DocEditorLoader";
import { getEntitlements, workspaceOwnerId, workspaceOwnerSelect } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import type { Block } from "@blocknote/core";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { TLEditorSnapshot } from "tldraw";
import CanvasViewer from "./_components/CanvasViewer";

// Shared links stay out of search engines.
export const metadata: Metadata = {
  title: "Shared workspace | Nexora",
  robots: { index: false, follow: false },
};

const SharedWorkspacePage = async ({ params }: PageProps<"/shared/[token]">) => {
  const { token } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      ...workspaceOwnerSelect,
      // The saved copies, never the live rooms.
      doc: { select: { content: true } },
      canvas: { select: { content: true } },
    },
  });

  if (!workspace) notFound();

  // Links stop working once the owner's plan no longer includes public sharing.
  const { publicSharing } = await getEntitlements(workspaceOwnerId(workspace));
  if (!publicSharing) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/6 bg-background px-4">
        <Link
          href="/"
          className="flex size-8 items-center justify-center rounded-md transition-opacity hover:opacity-80"
        >
          <Image
            src="/brand/mascot-dark.png"
            alt="Nexora home"
            width={24}
            height={24}
            className="size-6"
          />
        </Link>
        <h1 className="truncate text-sm font-medium">{workspace.name}</h1>
        <Badge variant="secondary">View only</Badge>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20}>
          <DocViewer content={workspace.doc?.content as Block[] | null} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75} minSize={20}>
          <CanvasViewer snapshot={workspace.canvas?.content as TLEditorSnapshot | null} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SharedWorkspacePage;
