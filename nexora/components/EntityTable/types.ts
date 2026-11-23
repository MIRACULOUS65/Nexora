import type { TLShape } from 'tldraw'

export const ENTITY_TABLE_TYPE = 'entity-table'

export const HEADER_HEIGHT = 36
export const ROW_HEIGHT = 28
export const DEFAULT_WIDTH = 260
export const MIN_WIDTH = 240

export type EntityTableRow = {
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
            rows: EntityTableRow[]
        }
    }
}

export type EntityTableShape = TLShape<typeof ENTITY_TABLE_TYPE>

/** The height is always derived from the row count: a header plus one fixed-height line per row. */
export function getTableHeight(rowCount: number) {
    return HEADER_HEIGHT + rowCount * ROW_HEIGHT
}

/** Vertical centre of a row, in the table's local space. */
export function getRowCenterY(rowIndex: number) {
    return HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2
}

export function createRow(overrides: Partial<EntityTableRow> = {}): EntityTableRow {
    return {
        id: crypto.randomUUID(),
        name: 'column',
        dataType: 'text',
        isPK: false,
        isFK: false,
        ...overrides,
    }
}

export function createStarterTableProps(): EntityTableShape['props'] {
    const rows = [
        createRow({ name: 'id', dataType: 'uuid', isPK: true }),
        createRow({ name: 'created_at', dataType: 'timestamptz' }),
    ]
    return {
        w: DEFAULT_WIDTH,
        h: getTableHeight(rows.length),
        tableName: 'table_name',
        rows,
    }
}
