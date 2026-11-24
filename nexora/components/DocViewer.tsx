"use client"

import { nexoraDarkTheme } from "@/lib/blacknote-theme";
import type { Block } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";

// A read-only render of the saved doc blocks, for the public shared page.
export function DocViewer({ content }: { content: Block[] | null }) {
  // BlockNote rejects an empty array, so an empty doc starts from its default block.
  const editor = useCreateBlockNote({
    initialContent: content?.length ? content : undefined,
  });

  return (
    <div className="h-full overflow-y-auto pt-6">
      <BlockNoteView editor={editor} editable={false} theme={nexoraDarkTheme} />
    </div>
  );
}
