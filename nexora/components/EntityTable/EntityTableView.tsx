"use client"

import React, { useEffect, useRef } from 'react'
import { HTMLContainer, stopEventPropagation, useEditor, useIsEditing } from 'tldraw'
import {
    HEADER_HEIGHT,
    ROW_HEIGHT,
    newRow,
    type EntityRow,
    type EntityTableShape,
} from './EntityTableShape'

// Brand amber is --primary in globals.css: oklch(0.74 0.16 55).
const AMBER = 'oklch(0.74 0.16 55)'

const COLORS = {
    background: '#0f0e0e',
    // Warm dark-brown wash fading down from the amber top edge.
    header: 'linear-gradient(180deg, oklch(0.31 0.05 55) 0%, oklch(0.23 0.03 55) 100%)',
    headerText: '#fafafa',
    surface: '#1c1a19',
    border: '#2b2827',
    divider: '#1e1c1b',
    text: '#f4f4f5',
    muted: '#8a8583',
    inputBackground: '#0a0909',
    accent: AMBER,
    pk: { background: 'rgba(234, 120, 40, 0.18)', color: '#f08a3c' },
    fk: { background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8' },
    danger: '#f87171',
}

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

const COMMON_TYPES = [
    'uuid', 'text', 'varchar', 'int', 'bigint', 'serial', 'boolean', 'numeric', 'float',
    'date', 'timestamp', 'timestamptz', 'json', 'jsonb',
]

function Badge({ kind }: { kind: 'PK' | 'FK' }) {
    const palette = kind === 'PK' ? COLORS.pk : COLORS.fk
    return (
        <span
            style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: '16px',
                padding: '0 6px',
                borderRadius: 4,
                letterSpacing: 0.4,
                background: palette.background,
                color: palette.color,
            }}
        >
            {kind}
        </span>
    )
}

const TABLE_ICON = (
    <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke={AMBER}
        strokeWidth="1.8"
        style={{ flexShrink: 0 }}
        aria-hidden
    >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M10 10v10" />
    </svg>
)

const inputStyle: React.CSSProperties = {
    minWidth: 0,
    height: 22,
    boxSizing: 'border-box',
    padding: '0 6px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    background: COLORS.inputBackground,
    color: COLORS.text,
    fontSize: 12,
    outline: 'none',
}

function ToggleButton({
    kind,
    active,
    onClick,
}: {
    kind: 'PK' | 'FK'
    active: boolean
    onClick: () => void
}) {
    const palette = kind === 'PK' ? COLORS.pk : COLORS.fk
    return (
        <button
            type="button"
            title={`Toggle ${kind}`}
            aria-pressed={active}
            onClick={onClick}
            style={{
                width: 24,
                height: 22,
                flexShrink: 0,
                padding: 0,
                border: `1px solid ${active ? palette.color : COLORS.border}`,
                borderRadius: 4,
                background: active ? palette.background : 'transparent',
                color: active ? palette.color : COLORS.muted,
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
            }}
        >
            {kind}
        </button>
    )
}

export function EntityTableView({ shape }: { shape: EntityTableShape }) {
    const editor = useEditor()
    const isEditing = useIsEditing(shape.id)
    const rootRef = useRef<HTMLDivElement>(null)
    const pendingFocusRowId = useRef<string | null>(null)
    const { w, h, tableName, rows } = shape.props

    const updateProps = (props: Partial<EntityTableShape['props']>) => {
        editor.updateShape<EntityTableShape>({ id: shape.id, type: shape.type, props })
    }

    const updateRow = (rowId: string, changes: Partial<EntityRow>) => {
        updateProps({ rows: rows.map((row) => (row.id === rowId ? { ...row, ...changes } : row)) })
    }

    const deleteRow = (rowId: string) => {
        updateProps({ rows: rows.filter((row) => row.id !== rowId) })
    }

    const addRow = () => {
        const row = newRow({ name: `column_${rows.length + 1}` })
        pendingFocusRowId.current = row.id
        updateProps({ rows: [...rows, row] })
    }

    // When editing starts, focus whatever was double-clicked: the title, or a row's name.
    useEffect(() => {
        if (!isEditing) return
        const pointer = editor.getPointInShapeSpace(shape.id, editor.inputs.getCurrentPagePoint())
        const insideTable = pointer.x >= 0 && pointer.x <= w && pointer.y >= 0 && pointer.y <= h
        const rowIndex = Math.floor((pointer.y - HEADER_HEIGHT) / ROW_HEIGHT)
        const row = insideTable ? rows[rowIndex] : undefined

        const frame = requestAnimationFrame(() => {
            const selector = row
                ? `[data-row-id="${row.id}"] [data-field="name"]`
                : '[data-field="table-name"]'
            const input = rootRef.current?.querySelector<HTMLInputElement>(selector)
            input?.focus()
            input?.select()
        })
        return () => cancelAnimationFrame(frame)
        // Only when editing starts; later row changes must not steal focus.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])

    // Focus the name of a row that was just added.
    useEffect(() => {
        const rowId = pendingFocusRowId.current
        if (!isEditing || !rowId) return
        pendingFocusRowId.current = null
        const input = rootRef.current?.querySelector<HTMLInputElement>(
            `[data-row-id="${rowId}"] [data-field="name"]`
        )
        input?.focus()
        input?.select()
    }, [rows, isEditing])

    const leaveOnEnterOrEscape = (e: React.KeyboardEvent) => {
        e.stopPropagation()
        if (e.key === 'Enter' || e.key === 'Escape') {
            ;(e.target as HTMLElement).blur()
            editor.setEditingShape(null)
        }
    }

    return (
        <HTMLContainer
            style={{ width: w, height: h, overflow: 'visible', pointerEvents: isEditing ? 'all' : 'none' }}
        >
            <div
                ref={rootRef}
                onPointerDown={isEditing ? stopEventPropagation : undefined}
                onTouchStart={isEditing ? stopEventPropagation : undefined}
                onTouchEnd={isEditing ? stopEventPropagation : undefined}
                style={{
                    width: w,
                    height: h,
                    boxSizing: 'border-box',
                    border: `1px solid ${isEditing ? COLORS.accent : COLORS.border}`,
                    borderTop: `1px solid ${COLORS.accent}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: COLORS.background,
                    color: COLORS.text,
                    fontFamily: FONT,
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                    userSelect: isEditing ? 'auto' : 'none',
                }}
            >
                <div
                    style={{
                        height: HEADER_HEIGHT,
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0 12px',
                        background: COLORS.header,
                        color: COLORS.headerText,
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    {TABLE_ICON}
                    {isEditing ? (
                        <input
                            data-field="table-name"
                            value={tableName}
                            aria-label="Table name"
                            onChange={(e) => updateProps({ tableName: e.target.value })}
                            onKeyDown={leaveOnEnterOrEscape}
                            style={{ ...inputStyle, flex: 1, fontWeight: 600, fontSize: 13 }}
                        />
                    ) : (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tableName}
                        </span>
                    )}
                </div>

                {rows.map((row) => (
                    <div
                        key={row.id}
                        data-row-id={row.id}
                        style={{
                            height: ROW_HEIGHT,
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0 12px',
                            borderTop: `1px solid ${COLORS.divider}`,
                            fontSize: 12,
                        }}
                    >
                        {isEditing ? (
                            <>
                                <input
                                    data-field="name"
                                    value={row.name}
                                    aria-label="Column name"
                                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                                    onKeyDown={leaveOnEnterOrEscape}
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <input
                                    data-field="type"
                                    list="entity-table-types"
                                    value={row.dataType}
                                    aria-label="Data type"
                                    onChange={(e) => updateRow(row.id, { dataType: e.target.value })}
                                    onKeyDown={leaveOnEnterOrEscape}
                                    style={{ ...inputStyle, width: 84, flexShrink: 0, fontFamily: MONO }}
                                />
                                <ToggleButton
                                    kind="PK"
                                    active={row.isPK}
                                    onClick={() => updateRow(row.id, { isPK: !row.isPK })}
                                />
                                <ToggleButton
                                    kind="FK"
                                    active={row.isFK}
                                    onClick={() => updateRow(row.id, { isFK: !row.isFK })}
                                />
                                <button
                                    type="button"
                                    title="Delete column"
                                    aria-label="Delete column"
                                    onClick={() => deleteRow(row.id)}
                                    style={{
                                        width: 18,
                                        height: 22,
                                        flexShrink: 0,
                                        padding: 0,
                                        border: 'none',
                                        background: 'transparent',
                                        color: COLORS.danger,
                                        fontSize: 15,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ×
                                </button>
                            </>
                        ) : (
                            <>
                                <span
                                    style={{
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: 13,
                                    }}
                                >
                                    {row.name}
                                </span>
                                {row.isPK && <Badge kind="PK" />}
                                {row.isFK && <Badge kind="FK" />}
                                <span
                                    style={{
                                        flex: 1,
                                        flexShrink: 0,
                                        textAlign: 'right',
                                        color: COLORS.muted,
                                        fontFamily: MONO,
                                        fontSize: 12,
                                    }}
                                >
                                    {row.dataType}
                                </span>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {isEditing && (
                <div
                    onPointerDown={stopEventPropagation}
                    onTouchStart={stopEventPropagation}
                    onTouchEnd={stopEventPropagation}
                    style={{ position: 'absolute', top: h + 8, left: 0, pointerEvents: 'all' }}
                >
                    <datalist id="entity-table-types">
                        {COMMON_TYPES.map((type) => (
                            <option key={type} value={type} />
                        ))}
                    </datalist>
                    <button
                        type="button"
                        onClick={addRow}
                        style={{
                            padding: '4px 10px',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 6,
                            background: COLORS.surface,
                            color: COLORS.text,
                            fontFamily: FONT,
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        + Add row
                    </button>
                </div>
            )}
        </HTMLContainer>
    )
}
