import {FieldInfo} from 'mysql';

export type QueryParams = StringMap | any[];

export interface Field {
    type: string,
    length: number,
    buffer: () => Buffer,
    string: () => string,
    geometry: () => any, // ???
}

export interface StringMap {
    [_: string]: any,
}

export interface TextRow {
    [_: string]: any,
}

export interface AnyObject {
    [_: string]: any,
    [_: number]: any,
    // [_: symbol]: any,
}

export type QueryResult = [any[], FieldInfo[]]

export type ResultPromise = Promise<QueryResult>

// https://stackoverflow.com/a/51603499/65387
export type TupleTypes<T> = { [P in keyof T]: T[P] } extends { [key: number]: infer V } ? V : never;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export interface ResultSetHeader {
    fieldCount: number,
    affectedRows: number,
    insertId: number,
    info: string,
    serverStatus: number,
    warningStatus: number,
}