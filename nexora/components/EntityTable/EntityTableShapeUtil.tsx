import React from 'react'
import { BaseBoxShapeUtil, T, type TLResizeInfo } from 'tldraw'
import { EntityTableView } from './EntityTableView'
import {
    TABLE_WIDTH,
    ENTITY_TABLE_TYPE,
    MIN_WIDTH,
    getTableHeight,
    type EntityTableShape,
} from './EntityTableShape'

const rowValidator = T.object({
    id: T.string,
    name: T.string,
    dataType: T.string,
    isPK: T.boolean,
    isFK: T.boolean,
})

/** Keeps `h` equal to the header plus one fixed-height line per row. */
function withDerivedHeight(shape: EntityTableShape): EntityTableShape | void {
    const h = getTableHeight(shape.props.rows.length)
    if (shape.props.h === h) return
    return { ...shape, props: { ...shape.props, h } }
}

export class EntityTableShapeUtil extends BaseBoxShapeUtil<EntityTableShape> {
    static override type = ENTITY_TABLE_TYPE
    static override props = {
        w: T.number,
        h: T.number,
        tableName: T.string,
        rows: T.arrayOf(rowValidator),
    }

    getDefaultProps(): EntityTableShape['props'] {
        return {
            w: TABLE_WIDTH,
            h: getTableHeight(0),
            tableName: 'table_name',
            rows: [],
        }
    }

    override canEdit() {
        return true
    }

    override hideRotateHandle() {
        return true
    }

    override isAspectRatioLocked() {
        return false
    }

    override onBeforeCreate(next: EntityTableShape) {
        return withDerivedHeight(next)
    }

    override onBeforeUpdate(_prev: EntityTableShape, next: EntityTableShape) {
        return withDerivedHeight(next)
    }

    // Only the width can change. The height is dictated by the rows, so vertical scaling is ignored.
    override onResize(shape: EntityTableShape, info: TLResizeInfo<EntityTableShape>) {
        const { initialShape, handle, scaleX } = info
        const w = Math.max(MIN_WIDTH, Math.round(initialShape.props.w * Math.abs(scaleX)))

        // Dragging from the left edge keeps the right edge fixed, so the origin moves with it.
        const fromLeft = handle === 'left' || handle === 'top_left' || handle === 'bottom_left'
        const shift = fromLeft ? initialShape.props.w - w : 0

        // Inside a multi-selection tldraw also repositions each shape within the selection box.
        if (this.editor.getSelectedShapeIds().length > 1) {
            return {
                x: info.newPoint.x,
                y: info.newPoint.y,
                props: { w, h: getTableHeight(initialShape.props.rows.length) },
            }
        }

        return {
            x: initialShape.x + shift * Math.cos(initialShape.rotation),
            y: initialShape.y + shift * Math.sin(initialShape.rotation),
            props: { w, h: getTableHeight(initialShape.props.rows.length) },
        }
    }

    component(shape: EntityTableShape) {
        return <EntityTableView shape={shape} />
    }

    getIndicatorPath(shape: EntityTableShape) {
        const path = new Path2D()
        path.roundRect(0, 0, shape.props.w, shape.props.h, 8)
        return path
    }
}
