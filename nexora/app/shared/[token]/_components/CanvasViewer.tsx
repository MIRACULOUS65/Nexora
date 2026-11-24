"use client"

import { EntityTableShapeUtil } from "@/components/EntityTable";
import { type Editor, type TLComponents, Tldraw, type TLEditorSnapshot } from "tldraw";
import "tldraw/tldraw.css";

// Defined once at module level: tldraw expects a stable array.
const shapeUtils = [EntityTableShapeUtil];

// View-only: no toolbar or style panel, since nothing can be edited.
const components: TLComponents = {
    StylePanel: null,
    PageMenu: null,
    MainMenu: null,
    Toolbar: null,
};

// A read-only render of the saved canvas snapshot, for the public shared page.
export default function CanvasViewer({ snapshot }: { snapshot: TLEditorSnapshot | null }) {
    const handleMount = (editor: Editor) => {
        editor.updateInstanceState({ isReadonly: true });
        editor.zoomToFit({ animation: { duration: 0 } });
    };

    return (
        <div className="isolate h-full">
            <Tldraw
                snapshot={snapshot ?? undefined}
                onMount={handleMount}
                shapeUtils={shapeUtils}
                components={components}
                colorScheme="dark"
            />
        </div>
    );
}
