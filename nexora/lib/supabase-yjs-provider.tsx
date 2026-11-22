// How long a newcomer waits for peers to send their unsaved edits.
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
    Awareness,
    applyAwarenessUpdate,
    encodeAwarenessUpdate,
    removeAwarenessStates,
} from "y-protocols/awareness";

import * as Y from "yjs";
import { supabase } from "./supabase";
import { fromBase64, toBase64 } from "./base64";
import { setTimeout } from "node:timers";

const PEER_SYNC_WAIT_MS = 500;

export class SupabaseYjsProvider {
    // Awareness: who's here and where their cursor is. Shared live, never saved.
    readonly awareness: Awareness;
    // The Supabase Realtime channel everyone on this doc joins.
    private channel: RealtimeChannel;
    // True once the channel is connected; nothing is sent before that.
    private subscribed = false;
    // Whether onReady has fired; it only fires once.
    private isReady = false;
    private readyTimeout?: ReturnType<typeof setTimeout>;

    constructor(
        private doc: Y.Doc,
        roomId: string,
        private onReady: () => void,
    ) {

        this.awareness = new Awareness(doc);

        this.channel = supabase.channel(`doc:${roomId}`, {
            config: { broadcast: { self: false } },
        });

        this.channel
            .on("broadcast", { event: "update" }, ({ payload }) => {
                Y.applyUpdate(this.doc, fromBase64(payload.update), this);
            })
            // Someone's cursor or name changed: show it.
            .on("broadcast", { event: "awareness" }, ({ payload }) => {
                applyAwarenessUpdate(this.awareness, fromBase64(payload.update), this);
            })
            // Someone just joined and asked for the latest state: send them ours.
            .on("broadcast", { event: "sync-request" }, () => {
                this.sendFullState();
            }).subscribe((status) => {
                if (status !== "SUBSCRIBED") {

                    //couldn't connect : open the editor anyway, with the copy saved in Postgres
                    this.subscribed = false;
                    this.markReady();
                    return;
                }

                this.subscribed = true;
                //joined. Send what we have, ask everyone for what we are missing, and give them 

                //PEER_SYNC_WAIT_MS to answer before opening editor

                this.sendFullState();
                this.send("sync-request", {});
                this.readyTimeout ??= setTimeout(this.markReady, PEER_SYNC_WAIT_MS);
            });

        //3 send our own changes to everyone else as they happen

        this.doc.on("update", this.handleDocUpdate);
        this.awareness.on("update", this.handleAwarenessUpdate);
    }

    // Runs on every doc change. Changes we received from others have `this` as their
    // origin,
    // so we skip those and only send the ones made here.
    private handleDocUpdate = (update: Uint8Array, origin: unknown) => {
        if (origin !== this) this.send("update", { update: toBase64(update) });
    };

    // Runs when anyone's presence changes. Same rule: only send changes made here.
    private handleAwarenessUpdate = (
        {
            added,
            updated,
            removed,
        }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
    ) => {
        if (origin === this) return;
        const changed = [...added, ...updated, ...removed];
        this.send("awareness", {
            update: toBase64(encodeAwarenessUpdate(this.awareness, changed)),
        });
    };


    // Tells the editor it can open. Called by the timer, or straight away if we couldn't connect.
    private markReady = () => {
        clearTimeout(this.readyTimeout);
        if (this.isReady) return;
        this.isReady = true;
        this.onReady();
    };


    // Our whole doc and our own cursor, for anyone catching up.
    private sendFullState() {
        this.send("update", { update: toBase64(Y.encodeStateAsUpdate(this.doc)) });
        this.send("awareness", {
            update: toBase64(
                encodeAwarenessUpdate(this.awareness, [this.doc.clientID]),
            ),
        });
    }

    // Broadcasts one message to everyone else. Yjs data is binary, so it travels as
    // base64.
    private send(event: string, payload: Record<string, unknown>) {
        if (!this.subscribed) return;
        this.channel.send({ type: "broadcast", event, payload });
    }

    // Called when the editor closes: stop listening, remove our cursor, and leave the channel.
    destroy() {
        clearTimeout(this.readyTimeout);
        this.isReady = true;
        // Tell everyone our cursor is gone before we leave.
        removeAwarenessStates(this.awareness, [this.doc.clientID], "destroy");
        this.doc.off("update", this.handleDocUpdate);
        this.awareness.off("update", this.handleAwarenessUpdate);
        this.awareness.destroy();
        supabase.removeChannel(this.channel);
    }
}