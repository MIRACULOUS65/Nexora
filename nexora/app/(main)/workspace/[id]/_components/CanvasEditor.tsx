"use client"

import { useWorkspaceEditors } from '@/components/WorkspaceEditorsContext';
import { useUser } from '@clerk/nextjs';
import React, { useMemo, useRef } from 'react'
import { atom, computed, createTLCurrentUser, createUserId, DefaultToolbar, DefaultToolbarContent, type Editor, getUserPreferences, type TLComponents, Tldraw, type TLEditorSnapshot, UserRecordType } from 'tldraw';

import { colorForUser } from "@/lib/utils"
import { useSyncDemo } from '@tldraw/sync';
import { Prisma } from '@/lib/generated/prisma/client';
import { saveCanvasContent } from '@/actions/canvas';

import { AddTableButton, EntityTableShapeUtil, registerEntityTableSnapping } from '@/components/EntityTable';

import "tldraw/tldraw.css";

// Defined once at module level: tldraw and useSyncDemo expect a stable array.
const shapeUtils = [EntityTableShapeUtil];

// A cleaner, single-page canvas: no style panel, page menu or main menu, and a
// vertical toolbar
// on the left with our Add table button.
const components: TLComponents = {
    StylePanel: null,
    PageMenu: null,
    MainMenu: null,
    Toolbar: () => (
        <DefaultToolbar orientation="vertical">
            <AddTableButton />
            <DefaultToolbarContent />
        </DefaultToolbar>
    ),
};

//save once drawing pauses for a second, not on every change
const SAVE_DEBOUNCE_MS = 1000;

const CanvasEditor = ({
    workspaceId,
    initialSnapshot,
}: {
    workspaceId: string;
    initialSnapshot: TLEditorSnapshot | null;
}) => {
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { setCanvasEditor } = useWorkspaceEditors();
    const { user } = useUser();

    // Gives other collaborators this user's real name/avatar on their cursor instead of "New User".
    // Memoized on primitives because useSync reconnects whenever the users object changes.
    const userId = user?.id;
    const userName = user?.fullName ?? user?.username ?? "Anonymous";
    const userImageUrl = user?.imageUrl ?? "";

    const users = useMemo(() => {
        if (!userId) return undefined;
        return {
            currentUser: atom(
                "currentUser",
                UserRecordType.create({
                    id: createUserId(userId),
                    name: userName,
                    color: colorForUser(userId),
                    imageUrl: userImageUrl,
                }),
            ),
        };
    }, [userId, userName, userImageUrl]);

    // The editor's own identity (people menu, your own cursor) is separate from what gets synced —
    // pin its name/color to Clerk too, keeping every other preference from tldraw's local storage.
    const currentUser = useMemo(() => {
        if (!userId) return undefined;
        return createTLCurrentUser({
            userPreferences: computed("clerkUserPreferences", () => ({
                ...getUserPreferences(),
                id: userId,
                name: userName,
                color: colorForUser(userId),
            })),
        });
    }, [userId, userName]);

    const store = useSyncDemo({ roomId: `nexora-${workspaceId}`, users, shapeUtils });

    //Runs once tldraw is ready. editor is the object for reading and changing the canvas.

    const handleMount = (editor: Editor) => {

        setCanvasEditor(editor);

        // Seed from Postgres only when the room is empty, so a joining user doesn't overwrite
        // what others have already drawn.
        if (initialSnapshot && editor.getCurrentPageShapeIds().size === 0) {
            // Replaces the empty canvas with the one saved in Postgres.
            editor.loadSnapshot(initialSnapshot);
        }

        editor.store.listen(() => {
            // Restart the wait on every change, then save the whole canvas to Postgres.
            if (saveTimeout.current) clearTimeout(saveTimeout.current);

            saveTimeout.current = setTimeout(() => {
                // getSnapshot() carries non-plain internals (schema is a class instance, not JSON) that
                // occasionally fail to cross the Server Action boundary as "opaque temporary reference"
                // errors -- round-tripping through JSON strips those and leaves genuinely plain data.
                const plainSnapshot = JSON.parse(
                    JSON.stringify(editor.getSnapshot()),
                ) as Prisma.InputJsonValue;

                saveCanvasContent(workspaceId, plainSnapshot);
            },SAVE_DEBOUNCE_MS);
        },{
            source:"user",
            scope:"document"
        });

        // Arrows dropped on a table snap to the nearest row.
        const unregisterSnapping = registerEntityTableSnapping(editor);

        return () => {
            unregisterSnapping();
            setCanvasEditor(null);
        };

    }

    return <div className="isolate h-full [&_.tlui-main-toolbar--vertical]:top-4!">
        <Tldraw
            store={store}
            user={currentUser}
            onMount={handleMount}
            shapeUtils={shapeUtils}
            components={components}
            colorScheme="dark"
        />
    </div>
}

export default CanvasEditor
