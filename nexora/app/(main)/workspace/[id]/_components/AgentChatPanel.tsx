"use client"


import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { WorkspaceAgentChat } from "@/hooks/use-workspace-agent-chat";
import { isDynamicToolUIPart, isToolUIPart } from "ai";
import { Send, Square, Wand2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { BeatLoader } from "react-spinners";
import { submitOnEnter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUpgradeDialog } from "@/components/UpgradeDialog";
import { PROMPT_LIMIT_ERROR, UPGRADE_REASONS } from "@/lib/plan-limits";
import { MODEL_BUSY_ERROR } from "@/lib/agent-errors";

export function AgentChatPanel({ chat, isReady }: { chat: WorkspaceAgentChat; isReady: boolean }) {

    const [input, setInput] = useState("");
    const { messages, sendMessage, regenerate, stop, status, error } = chat;
    const openUpgrade = useUpgradeDialog();

    const isBusy = status === "submitted" || status === "streaming";
    const handleSend = () => {
        const trimmed = input.trim();

        // Enter must not send mid-response either: a second request running alongside
        // the first makes the SDK re-add the in-progress assistant message, duplicating its id.
        if (!trimmed || !isReady || isBusy) return;

        sendMessage({ text: trimmed });
        setInput("");
    };

    return (<div className="pointer-events-none fixed inset-x-0 top-14 bottom-0 z-30">
        <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel />
            <ResizableHandle className="pointer-events-auto" />
            <ResizablePanel // The chat starts at 360px wide, and can be dragged between 280px and 640px.
                defaultSize={360}
                minSize={280}
                maxSize={640}
                className="pointer-events-auto flex flex-col border-l border-white/10 bg-card shadow-2xl"
            >
                <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/6 px-4 text-sm font-medium">
                    <Image
                        src="/brand/mascot-dark.png"
                        alt=""
                        width={18}
                        height={18}
                        className="size-4.5"
                    />
                    Outpost Agent
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {messages.length === 0 ? <p className="text-sm text-muted-foreground">
                        Ask the agent to draw a diagram, write or edit the doc , or both. Say &ldquo; in the doc&rdquo; or &ldquo; on the canvas&rdquo; to keep it to one side.
                    </p> : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`space-y-1.5 rounded-lg px-3 py-2 text-sm ${message.role === "user"
                                    ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                                    : "mr-auto w-full border border-white/10 bg-black text-foreground"
                                    }`}
                            >
                                {message.parts.map((part, i) => {
                                    if (part.type === "reasoning") {
                                        const isStreaming = part.state === "streaming";

                                        return (
                                            <div key={i}>
                                                <div className="mb-1 flex items-center gap-1.5">
                                                    <Wand2
                                                        className={`h-3 w-3 shrink-0 text-blue-400/60 ${isStreaming ? "animate-pulse" : ""
                                                            }`}
                                                    />
                                                    <span className="text-[10px] font-medium uppercase tracking-wider text-blue-400/50">
                                                        {part.text ? "Agent reasoning" : "Thinking..."}
                                                    </span>
                                                </div>

                                                {part.text && (
                                                    <p className="text-[12px] leading-relaxed text-white/35">
                                                        {part.text}
                                                        {isStreaming && (
                                                            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse align-middle bg-blue-400/60" />
                                                        )}
                                                    </p>
                                                )}

                                            </div>
                                        )
                                    }
                                    if (part.type === "text")
                                        return <span key={i}>{part.text}</span>;

                                    // A tool call: a check mark once its result is in.
                                    if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
                                        const toolName = isDynamicToolUIPart(part)
                                            ? part.toolName
                                            : part.type.replace(/^tool-/, "");

                                        return (
                                            <div
                                                key={i}
                                                className="rounded-md bg-black/20 px-2 py-1 text-xs text-muted-foreground"
                                            >
                                                {part.state === "output-available" ? "YeS" : "..."}{""}
                                                {toolName}
                                            </div>
                                        )
                                    }
                                    return null;
                                })}

                            </div>


                        )))
                    }
                    {isBusy && (<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BeatLoader size={4} color="currentColor" />
                        Thinking...
                    </p>)}

                    {error && (
              <p className="rounded-md border border-white/10 bg-white/3 px-3 py-2 text-xs text-muted-foreground">
                {error.message.includes(PROMPT_LIMIT_ERROR) ? (
                  <>
                    You&apos;re out of agent prompts this month.{" "}
                    <button
                      type="button"
                      onClick={() => openUpgrade(UPGRADE_REASONS.prompts)}
                      className="font-medium text-primary hover:underline"
                    >
                      Upgrade
                    </button>
                  </>
                ) : (
                  <>
                    {error.message.includes(MODEL_BUSY_ERROR)
                      ? "The model is busy right now (high demand)."
                      : "Something went wrong."}{" "}
                    <button
                      type="button"
                      onClick={() => regenerate()}
                      disabled={isBusy}
                      className="font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      Retry
                    </button>
                  </>
                )}
              </p>
            )}
                </div>
                <div className="flex shrink-0 items-end gap-2 border-t border-white/6 p-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={submitOnEnter(handleSend)}
                        placeholder="Ask the agent..."
                        rows={1}
                        disabled={!isReady}
                        className="max-h-32 flex-1 resize-none rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-ring disabled:opacity-50"
                    />
                    {isBusy ? (
                        <Button size="icon" variant="secondary" onClick={stop}>
                            <Square className="size-3.5" />
                        </Button>
                    ) : (
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!input.trim() || !isReady}
                        >
                            <Send className="size-4" />
                        </Button>
                    )}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>

    </div>
    )
}