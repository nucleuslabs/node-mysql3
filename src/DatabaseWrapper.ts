// @ts-ignore
import MySql from 'mysql2/promise';
import ResultWrapper from './ResultWrapper';
import fromEmitter from '@async-generators/from-emitter';
import formatSql from './formatSql';
import {setDefaults} from './util';
import {Field, QueryParams, ResultPromise} from './types';
import {Pool, PoolConfig, TypeCast} from 'mysql';

export function escapeIdString(id: string) {
    return '`' + String(id).replace(/`/g,'``') + '`';
}

export default class DatabaseWrapper {
    pool: any;

    constructor({sqlMode, foreignKeyChecks, ...options}: {sqlMode: string|string[], foreignKeyChecks: boolean, options: PoolConfig}) {
        setDefaults(options, {
            timezone: 'UTC',
            queryFormat: formatSql,
            charset: 'utf8mb4_unicode_520_ci',
            connectionLimit: 10,
            typeCast: ((field, next) => {
                if(field.type === 'BIT' && field.length === 1) {
                    let buf = field.buffer();
                    return buf[0] === 1;
                }
                return next();
            }) as TypeCast,
            sqlMode: [
                'ONLY_FULL_GROUP_BY',
                'STRICT_TRANS_TABLES',
                'STRICT_ALL_TABLES',
                'NO_ZERO_IN_DATE',
                'NO_ZERO_DATE', 
                'ERROR_FOR_DIVISION_BY_ZERO',
                // 'NO_AUTO_CREATE_USER', // not allowed in MySQL 8
                'NO_ENGINE_SUBSTITUTION',
                'NO_UNSIGNED_SUBTRACTION',
                'PAD_CHAR_TO_FULL_LENGTH',
            ],
        });
        // dump(options);
        
        this.pool = MySql.createPool(options);
        
        if(sqlMode != null || foreignKeyChecks != null) {
            if(Array.isArray(sqlMode)) {
                sqlMode = sqlMode.join(',');
            }
            this.pool.on('connection', (conn: any) => {
                if(sqlMode != null) {
                    conn.query(`SET sql_mode=?`, [sqlMode]);
                }
                if(foreignKeyChecks != null) {
                    conn.query(`SET foreign_key_checks=?`, [foreignKeyChecks ? 1 : 0]);
                }
            });
        }
    }

    query(sql: string, params?: QueryParams) {
        return new ResultWrapper(this.pool.query(sql, params));
    }

    async exec(sql: string, params?: QueryParams) {
        const [res] = await this.pool.query(sql, params);
        return res;
    }
    
    escapeValue(value: any): string {
        return this.pool.escape(value);
    }
    
    escapeId(id: any): string {
        if(Array.isArray(id)) {
            return id.map(escapeIdString).join('.')
        }
        return escapeIdString(id);
    }
    
    stream(sql: string, params?: QueryParams) {
        return fromEmitter(this.pool.pool.query(sql, params),{
            onNext: 'result',
            onError: 'error',
            onDone: 'end',
        });
    }

    close(): void {
        return this.pool.end();
    }
}
