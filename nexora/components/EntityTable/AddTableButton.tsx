"use client"

import React from 'react'
import { createShapeId, TldrawUiButtonIcon, TldrawUiToolbarButton, useEditor } from 'tldraw'
import { ENTITY_TABLE_TYPE, createStarterTableProps, type EntityTableShape } from './types'

const TABLE_ICON = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M3 15h18M10 10v10" />
    </svg>
)

/** Drops a starter table in the middle of the current view. */
export function AddTableButton() {
    const editor = useEditor()

    const addTable = () => {
        const props = createStarterTableProps()
        const center = editor.getViewportPageBounds().center
        const id = createShapeId()

        editor.markHistoryStoppingPoint('add table')
        editor.createShape<EntityTableShape>({
            id,
            type: ENTITY_TABLE_TYPE,
            x: center.x - props.w / 2,
            y: center.y - props.h / 2,
            props,
        })
        editor.setCurrentTool('select')
        editor.setSelectedShapes([id])
    }

    return (
        <TldrawUiToolbarButton type="tool" tooltip="Add table" aria-label="Add table" onClick={addTable}>
            <TldrawUiButtonIcon icon={TABLE_ICON} />
        </TldrawUiToolbarButton>
    )
}
