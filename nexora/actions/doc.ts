"use server"

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspace } from "@/lib/workspace-access";
import * as Y from "yjs"
export async function saveDocContent(
    workspaceId: string,
    yjsState: string,
    content: Prisma.InputJsonValue,
) {
    if (!(await canAccessWorkspace(workspaceId)))
        throw new Error("workspace not found");

    // Back from the base64 string to Yjs bytes.
    const incoming = Buffer.from(yjsState, "base64");

    await prisma.$transaction(async (tx) => {
        // 1. Read the stored state. FOR UPDATE locks the row, so a second save waits for
        // this one.
        const [row] = await tx.$queryRaw<{ yjsState: Uint8Array | null }[]>`
    SELECT "yjsState" FROM "Doc" WHERE "workspaceId" = ${workspaceId} FOR UPDATE`;

        // 2. Merge the two states. Yjs keeps every edit from both, nothing is lost.
        const merged = row?.yjsState
            ? Y.mergeUpdates([row.yjsState, incoming])
            : incoming;

        await tx.doc.update({
            where: { workspaceId },
            data: { yjsState:Uint8Array.from(merged),content },
        });
    });
}