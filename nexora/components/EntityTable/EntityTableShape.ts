import type { TLShape } from 'tldraw'

export const ENTITY_TABLE_TYPE = 'entity-table'

export const HEADER_HEIGHT = 36
export const ROW_HEIGHT = 28
/** Default width of a new table. */
export const TABLE_WIDTH = 260
export const MIN_WIDTH = 240

export type EntityRow = {
    id: string
    name: string
    dataType: string
    isPK: boolean
    isFK: boolean
}

declare module 'tldraw' {
    export interface TLGlobalShapePropsMap {
        [ENTITY_TABLE_TYPE]: {
            w: number
            h: number
            tableName: string
            rows: EntityRow[]
        }
    }
}

export type EntityTableShape = TLShape<typeof ENTITY_TABLE_TYPE>

/** The height is always derived from the row count: a header plus one fixed-height line per row (at least one). */
export function getTableHeight(rowCount: number) {
    return HEADER_HEIGHT + Math.max(1, rowCount) * ROW_HEIGHT
}

/**
 * Vertical centre of a row as a 0-1 fraction of the table's height, for anchoring arrows on a row.
 */
export function rowAnchorY(rowIndex: number, rowCount: number) {
    return (HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2) / getTableHeight(rowCount)
}

/** A complete row with a fresh id and defaults, overridden by whatever is passed in. */
export function newRow(row: Partial<EntityRow> = {}): EntityRow {
    return {
        id: crypto.randomUUID(),
        name: '',
        dataType: 'text',
        isPK: false,
        isFK: false,
        ...row,
    }
}

export function createStarterTableProps(): EntityTableShape['props'] {
    const rows = [
        newRow({ name: 'id', dataType: 'uuid', isPK: true }),
        newRow({ name: 'created_at', dataType: 'timestamptz' }),
    ]
    return {
        w: TABLE_WIDTH,
        h: getTableHeight(rows.length),
        tableName: 'table_name',
        rows,
    }
}
