"use client"

import { useChat } from "@ai-sdk/react";
import type { BlockNoteEditor } from "@blocknote/core";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import type { Editor } from "tldraw";

type Editors={canvasEditor:Editor | null; docEditor:BlockNoteEditor|null};

export function useWorkspaceAgentChat(workspaceId:string,editors:Editors){

    const [transport] = useState(()=>new DefaultChatTransport({
        api:"/api/agent",
        body:()=>{
            return {
                workspaceId,
            };
        }
    }))

    //useChat(AI SDK): the messages,streaming and sending , in one hook.
    const chat = useChat({
        transport,
    });

    return chat;
}


export type WorkspaceAgentChat = ReturnType<typeof useWorkspaceAgentChat>;