"use client"

import { useWorkspaceEditors } from '@/components/WorkspaceEditorsContext';
import { outpostDarkTheme } from '@/lib/blacknote-theme';
import type { Block } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import React, { useEffect } from 'react'
import "@blocknote/mantine/style.css"
import type { Prisma } from '@/lib/generated/prisma/client';
import { saveDocContent } from '@/actions/doc';
import { SupabaseYjsProvider } from '@/lib/supabase-yjs-provider';
import * as Y from "yjs"
import { useUser } from '@clerk/nextjs';
import { useCollaborativeDoc } from '@/hooks/use-collaborative-doc';
import { colorForUser } from '@/lib/utils';
import { CollaborationExtension } from '@blocknote/core/yjs';
import { toBase64 } from '@/lib/base64';

type DocEditorProps = {
  workspaceId: string;
  initialContent: Block[] | null;
  initialState: string | null;
};

const SAVE_DEBOUNCE_MS = 1000;

export function DocEditor({
  workspaceId,
  initialContent,
  initialState,
}: DocEditorProps) {
  const { user } = useUser();
  const collab = useCollaborativeDoc(workspaceId, initialState);

  if (!collab || !user) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading Document...
      </div>
    );
  }

  return (
    <CollaborativeEditor
      workspaceId={workspaceId}
      initialContent={initialContent}
      doc={collab.doc}
      provider={collab.provider}
      user={{ name: user.fullName ?? user.username ?? "Anonymous", color: colorForUser(user.id) }}
    />
  )
}

export const CollaborativeEditor = ({ workspaceId, initialContent, doc, provider, user }: Omit<DocEditorProps, "initialState"> & {
  doc: Y.Doc;
  provider: SupabaseYjsProvider;
  user: { name: string; color: string };
}) => {

  //the part of the Yjs doc that holds the editors blocks
  const fragment = doc.getXmlFragment("document-store");


  // Blocknote rejects an empty array, so a new doc starts with its default empty block.

  const editor = useCreateBlockNote({
    extensions: [CollaborationExtension({ fragment, user, provider })],
  });

  const { setDocEditor } = useWorkspaceEditors();

  useEffect(() => {
    setDocEditor(editor);
    return () => setDocEditor(null);
  }, [editor, setDocEditor]);

  // A doc saved in Step 3 has JSON but no Yjs state yet. If the shared doc is empty and
  // there's saved JSON, load it in once; from then on, Yjs keeps it.
  useEffect(() => {
    if (fragment.length === 0 && initialContent?.length) {
      editor.replaceBlocks(editor.document, initialContent);
    }
  }, [editor, fragment, initialContent]);

  //save a second after typing stops, as plain JSON blocks

  useEffect(() => {
    //the pending save; eveyr edit restarts the wait.
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const save = () => {
      timeout = undefined;
      //a plain JSON copy of the blocks, for features that read the doc on the server.

      const content = JSON.parse(
        JSON.stringify(editor.document),
      ) as Prisma.InputJsonValue;

      saveDocContent(workspaceId, toBase64(Y.encodeStateAsUpdate(doc)), content);
    };

    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin === provider) return;
      clearTimeout(timeout);
      timeout = setTimeout(save, SAVE_DEBOUNCE_MS);
    };

    doc.on("update", handleUpdate);

    return () => {
      doc.off("update", handleUpdate);

      // Leaving with a save still waiting: save right away, so the last edits aren't lost.
      if (timeout) {
        clearTimeout(timeout);
        save();
      }
    };

  }, [doc, editor, provider, workspaceId]);

  return (
    <div className="h-full overflow-y-auto pt-6">
      {/* Renders the editor UI in our dark colors. */}
      <BlockNoteView editor={editor} theme={outpostDarkTheme} />
    </div>
  );
}

