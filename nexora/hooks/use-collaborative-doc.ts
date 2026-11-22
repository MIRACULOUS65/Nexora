"use client"

import { fromBase64 } from "@/lib/base64";
import { SupabaseYjsProvider } from "@/lib/supabase-yjs-provider";
import { useEffect, useState } from "react";
import * as Y from "yjs"

// Sets up live collaboration for one workspace's doc:
//   1. creates a Yjs doc and loads the copy saved in Postgres into it
//   2. connects it to everyone else through our Supabase provider
//   3. returns { doc, provider } once the provider has caught up with the others
// Until then it returns null, so the editor never opens on an out-of-date copy.

export function useCollaborativeDoc(
    workspaceId: string,
    initialState: string | null,
) {
    const [collab, setCollab] = useState<{
        doc: Y.Doc;
        provider: SupabaseYjsProvider;
    } | null>(null);

    const [savedState] = useState(initialState);

    useEffect(() => {
        //a yjs doc:shared data that merges everyone's edits without conflicts.
        const doc = new Y.Doc();

        //start from what was saved in Postgres (sent from the server as base64).

        if (savedState) Y.applyUpdate(doc, fromBase64(savedState));
        // Join the doc's channel. The callback runs once we've caught up, and hands the doc to the editor.
        const provider = new SupabaseYjsProvider(doc, workspaceId, () =>
            setCollab({ doc, provider }),
        );

        // When the editor closes (or the workspace changes): leave the channel and free the doc.
        return () => {
            provider.destroy();
            doc.destroy();
        };

    }, [workspaceId, savedState]);

    return collab;
}

