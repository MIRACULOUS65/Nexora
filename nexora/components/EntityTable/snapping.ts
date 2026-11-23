import type { Editor, TLArrowBinding, TLArrowShape, TLBinding } from 'tldraw'
import {
    ENTITY_TABLE_TYPE,
    HEADER_HEIGHT,
    ROW_HEIGHT,
    getRowCenterY,
    type EntityTableShape,
} from './types'

/**
 * Arrow bindings that point at an entity table are snapped to a row: the anchor moves to the middle
 * of the nearest row on the left or right edge, and the row id is stored in the binding's meta so
 * the arrow keeps following that column when rows are added or removed.
 */

type Terminal = 'start' | 'end'

function isArrowBinding(binding: TLBinding): binding is TLArrowBinding {
    return binding.type === 'arrow'
}

function getTable(editor: Editor, binding: TLArrowBinding): EntityTableShape | undefined {
    const shape = editor.getShape(binding.toId)
    return shape && shape.type === ENTITY_TABLE_TYPE ? (shape as EntityTableShape) : undefined
}

/** Index of the row closest to a y coordinate in table space (header counts as the first row). */
function nearestRowIndex(rowCount: number, localY: number) {
    const index = Math.floor((localY - HEADER_HEIGHT) / ROW_HEIGHT)
    return Math.min(Math.max(index, 0), rowCount - 1)
}

/** True while the user is dragging an arrow terminal, so the pointer decides which row to bind to. */
function isDraggingArrowTerminal(editor: Editor) {
    return editor.isIn('select.dragging_handle') || editor.isIn('arrow.pointing')
}

/** Which edge of the table faces the other end of the arrow: 0 for left, 1 for right. */
function getFacingSide(editor: Editor, table: EntityTableShape, binding: TLArrowBinding): 0 | 1 {
    const arrow = editor.getShape<TLArrowShape>(binding.fromId)
    if (!arrow) return binding.props.normalizedAnchor.x < 0.5 ? 0 : 1

    const terminal = binding.props.terminal as Terminal
    const otherTerminal: Terminal = terminal === 'start' ? 'end' : 'start'
    const otherBinding = editor
        .getBindingsFromShape<TLArrowBinding>(arrow, 'arrow')
        .find((b) => b.props.terminal === otherTerminal)

    const otherPagePoint = otherBinding
        ? editor.getShapePageBounds(otherBinding.toId)?.center
        : editor.getShapePageTransform(arrow).applyToPoint(arrow.props[otherTerminal])

    if (!otherPagePoint) return binding.props.normalizedAnchor.x < 0.5 ? 0 : 1
    return editor.getPointInShapeSpace(table, otherPagePoint).x < table.props.w / 2 ? 0 : 1
}

function snapBindingToRow(
    editor: Editor,
    binding: TLArrowBinding,
    previousTable?: EntityTableShape
): TLArrowBinding {
    const table = getTable(editor, binding)
    if (!table) return binding

    const { rows, h } = table.props
    const meta = { ...binding.meta }
    let normalizedY: number

    if (rows.length === 0) {
        // Nothing to point at, so aim for the middle of the header.
        delete meta.rowId
        normalizedY = HEADER_HEIGHT / 2 / h
    } else {
        let rowIndex: number
        const pinnedRowId = typeof meta.rowId === 'string' ? meta.rowId : undefined
        const pinnedIndex = pinnedRowId ? rows.findIndex((row) => row.id === pinnedRowId) : -1

        if (isDraggingArrowTerminal(editor)) {
            // The user is placing the end of the arrow: follow the pointer.
            const pointer = editor.getPointInShapeSpace(table, editor.inputs.getCurrentPagePoint())
            rowIndex = nearestRowIndex(rows.length, pointer.y)
        } else if (pinnedIndex !== -1) {
            rowIndex = pinnedIndex
        } else if (pinnedRowId && previousTable) {
            // The pinned row was deleted: fall back to whatever now sits at its old position.
            const oldIndex = previousTable.props.rows.findIndex((row) => row.id === pinnedRowId)
            rowIndex = Math.min(Math.max(oldIndex, 0), rows.length - 1)
        } else {
            rowIndex = nearestRowIndex(rows.length, binding.props.normalizedAnchor.y * h)
        }

        meta.rowId = rows[rowIndex].id
        normalizedY = getRowCenterY(rowIndex) / h
    }

    const normalizedX = getFacingSide(editor, table, binding)
    const { normalizedAnchor } = binding.props

    const unchanged =
        binding.props.isPrecise &&
        !binding.props.isExact &&
        normalizedAnchor.x === normalizedX &&
        Math.abs(normalizedAnchor.y - normalizedY) < 1e-6 &&
        meta.rowId === binding.meta.rowId
    if (unchanged) return binding

    return {
        ...binding,
        meta,
        props: {
            ...binding.props,
            isPrecise: true,
            isExact: false,
            normalizedAnchor: { x: normalizedX, y: normalizedY },
        },
    }
}

/** Registers the side effects that snap arrows to table rows. Returns a function that removes them. */
export function registerEntityTableSnapping(editor: Editor) {
    const snapOnWrite = (binding: TLBinding) =>
        isArrowBinding(binding) ? snapBindingToRow(editor, binding) : binding

    const unregisterCreate = editor.sideEffects.registerBeforeCreateHandler('binding', snapOnWrite)
    const unregisterChange = editor.sideEffects.registerBeforeChangeHandler('binding', (_prev, next) =>
        snapOnWrite(next)
    )

    // When rows are added, removed or the table is resized, arrows keep pointing at their column.
    const unregisterShapeChange = editor.sideEffects.registerAfterChangeHandler(
        'shape',
        (prev, next) => {
            if (next.type !== ENTITY_TABLE_TYPE || prev.type !== ENTITY_TABLE_TYPE) return
            const before = prev as EntityTableShape
            const after = next as EntityTableShape
            if (before.props.rows === after.props.rows && before.props.h === after.props.h) return

            for (const binding of editor.getBindingsToShape<TLArrowBinding>(after, 'arrow')) {
                const snapped = snapBindingToRow(editor, binding, before)
                if (snapped !== binding) editor.updateBinding(snapped)
            }
        }
    )

    return () => {
        unregisterCreate()
        unregisterChange()
        unregisterShapeChange()
    }
}
