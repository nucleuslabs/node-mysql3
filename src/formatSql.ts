// import {log} from './debug';
import {isPlainObject} from './util';
import {QueryParams} from './types';
import {EscapeFunctions} from 'mysql';
// import * as assert from 'assert';

const {hasOwnProperty} = Object.prototype;

const strPatt = /(['"`])(?:\\.|\1\1|(?!\1).)*\1/g;
const objPatt = /:{1,2}[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/g;
const arrPatt = /\?{1,2}/g;

function splitQuery(str: string): [string[], string[]] {
    let sqlFrags = [];
    let stringLiterals = [];
    let lastIndex = 0;
    let match;

    while ((match = strPatt.exec(str)) !== null) {
        sqlFrags.push(str.slice(lastIndex, match.index));
        lastIndex = match.index + match[0].length;
        stringLiterals.push(match[0]);
    }
    sqlFrags.push(str.slice(lastIndex));
    return [sqlFrags, stringLiterals];
}


export default function formatSql(this: EscapeFunctions, sqlQuery: string, values: QueryParams) {
    if (!values || (Array.isArray(values) && values.length === 0)) {
        return sqlQuery;
    }
    let [sqlFrags, stringLiterals] = splitQuery(sqlQuery);

    if (Array.isArray(values)) {
        sqlFrags = sqlFrags.map(frag => {
            let i = -1;
            return frag.replace(arrPatt, m => {
                if (++i >= (<any[]>values).length) {
                    throw new Error(`Not enough placeholder values`);
                }
                if (m.length === 1) {
                    return escapeValue.call(this, (<any[]>values)[i]);
                }
                return escapeId.call(this, (<any[]>values)[i]);
            });
        });
    } else if (isPlainObject(values)) {
        sqlFrags = sqlFrags.map(frag => frag.replace(objPatt, m => {
            if (m.startsWith('::')) {
                let p = m.slice(2);
                if (!hasOwnProperty.call(values, p)) {
                    throw new Error(`Missing placeholder id ${p}`);
                }
                return escapeId.call(this, values[p]);
            }
            let p = m.slice(1);
            if (!hasOwnProperty.call(values, p)) {
                throw new Error(`Missing placeholder value ${p}`);
            }
            return escapeValue.call(this, values[p]);
        }));
    } else {
        throw new Error(`Unsupported values type`);
    }


    let formattedQuery = weave(sqlFrags, stringLiterals).join('');
    // console.log(formattedQuery);
    // console.log(`${Chalk.bold('QUERY:')} ${formattedQuery}`);
    return formattedQuery;
}

function escapeId(this: EscapeFunctions, value: any) {
    if (isPlainObject(value)) {
        // FIXME: not sure if this is a good idea or not... only supporting "AND" is probably too limited
        let keys = Object.keys(value);
        if (keys.length === 0) {
            return '1';
        }
        // TODO: add support for "IN" when value[k] is an array/iterable
        let where = keys.map(k => `${escapeId.call(this, k)}=${escapeValue.call(this, value[k])}`).join(' AND ');
        if (keys.length > 1) {
            return `(${where})`;
        }
        return where;
    }
    if (value instanceof Set) {
        value = Array.from(value);
    }
    return this.escapeId(value);
}

function escapeValue(this: EscapeFunctions, value: any) {
    if (isPlainObject(value)) {
        let keys = Object.keys(value);
        if (keys.length === 0) {
            throw new Error(`Cannot escape empty object`);
        }
        return keys.map(k => `${escapeId.call(this, k)}=${escapeValue.call(this, value[k])}`).join(',');
    }
    if (value instanceof Set) {
        value = Array.from(value);
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            throw new Error(`Cannot escape empty array`);
        }
        if (Array.isArray(value[0])) {
            return value.map(v => `(${escapeValue.call(this, v)})`).join(',');
        }
        return value.map(v => escapeValue.call(this, v)).join(',');
    }
    if (value instanceof Date) {
        return value.getTime();
    }
    return this.escape(value);
}

function weave(a: any[], b: any[]) {
    let out = [];
    let i = 0;
    for (; i < b.length; ++i) {
        out.push(a[i], b[i]);
    }
    out.push(a[i]);
    return out;
}