"use client"

import { useChat } from "@ai-sdk/react";
import type { BlockNoteEditor } from "@blocknote/core";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "tldraw";
import { agentToolDefs, docToolDefs, fail, type ToolResult } from "@/lib/agent-tools";
import { executeCanvasTool, summarizeCanvas, type ShapeIdMap } from "@/lib/agent-canvas";
import { executeDocTool, summarizeDoc } from "@/lib/agent-doc";
import { refreshPromptUsage } from "@/components/PlanButton";
import { PROMPT_LIMIT_ERROR, UPGRADE_REASONS } from "@/lib/plan-limits";
import { useUpgradeDialog } from "@/components/UpgradeDialog";

type Editors = { canvasEditor: Editor | null; docEditor: BlockNoteEditor | null };

function runTool({ canvasEditor, docEditor }: Editors, idMap: ShapeIdMap, toolName: string, input: unknown): ToolResult {
    try {
        if(toolName in docToolDefs){
            return docEditor?executeDocTool(docEditor,toolName,input):fail("the doc isn't open in this view. tell the user to switch to the both or document view.");
        }
        return canvasEditor
            ? executeCanvasTool(canvasEditor, idMap, toolName, input)
            : fail(
                "The canvas isn't open in this view. Tell the user to switch to the Both or Canvas view.",
            );
    } catch (err) {
        // A bad input or a tldraw error becomes a failure message, so Gemini can try again.
        return fail(err instanceof Error ? err.message : "Tool failed");
    }
}

export function useWorkspaceAgentChat(workspaceId: string, editors: Editors) {


    const idMap = useRef<ShapeIdMap>(new Map());

    const openUpgrade = useUpgradeDialog();

    const editorsRef = useRef(editors);
    useEffect(() => {
        editorsRef.current = editors;
    });

    // eslint-disable-next-line react-hooks/refs -- body() runs at send time, not during render
    const [transport] = useState(() => new DefaultChatTransport({
        api: "/api/agent",
        body: () => {

            const { canvasEditor, docEditor } = editorsRef.current;
            return {
                workspaceId, canvasContext: canvasEditor ? summarizeCanvas(canvasEditor) : null,
                docContext: docEditor? summarizeDoc(docEditor):null,
            };
        },
    }),);

    //useChat(AI SDK): the messages,streaming and sending , in one hook.
    const chat = useChat({
        transport,
        onFinish: refreshPromptUsage,
        onError: (error)=>{
            if(!error.message.includes(PROMPT_LIMIT_ERROR)) return;
            refreshPromptUsage();
            openUpgrade(UPGRADE_REASONS.prompts);
        },

        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

        onToolCall: ({ toolCall }) => {
            const output = runTool(editorsRef.current, idMap.current, toolCall.toolName, toolCall.input);

            // Not awaited: the SDK checks for the automatic resubmit right after this
            // callback returns.
            // Hand the result back to the chat, matched to the call by toolCallId.
            chat.addToolOutput({
                tool: toolCall.toolName as keyof typeof agentToolDefs,
                toolCallId: toolCall.toolCallId,
                output,
            });
        }
    });

    return chat;
}


export type WorkspaceAgentChat = ReturnType<typeof useWorkspaceAgentChat>;