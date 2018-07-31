import {ResultPromise, StringMap} from './types';

export default class ResultWrapper {
    result: ResultPromise;
    
    constructor(resultPromise: ResultPromise) {
        this.result = resultPromise;
    }
    
    async fetchRow(): Promise<StringMap|null> {
        // fetch one row and then release the connection rather than
        // waiting for all the rows?
        let [rows,fields] = await this.result;
        if(!rows.length) return null;
        if(rows.length > 1) throw new Error("You should only query for one row when using `fetchRow`");
        return rows[0];
    }
    
    fetchAll(): Promise<StringMap[]> {
        return this.result.then(([rows, fields]) => rows);
    }
    
    async fetchValue(): Promise<any> {
        let [rows,fields] = await this.result;
        if(!rows.length) return null;
        if(rows.length > 1) throw new Error("You should only query for one row when using `fetchValue`");
        if(fields.length > 1) throw new Error("You should only query for one field when using `fetchValue`");
        return rows[0][fields[0].name];
    }
    
    async fetchColumn(): Promise<any[]> {
        let [rows,fields] = await this.result;
        if(!rows.length) return [];
        if(fields.length > 1) throw new Error("You should only query for one field when using `fetchColumn`");
        const name = fields[0].name;
        return rows.map(r => r[name]);
    }
    
    async fetchPairs(): Promise<StringMap> {
        let [rows,fields] = await this.result;
        if(fields.length !== 2) throw new Error("`fetchPairs` expects exactly 2 columns");
        if(!rows.length) return {};
        const key = fields[0].name;
        const val = fields[1].name;
        return rows.reduce((acc,row) => {
            acc[row[key]] = row[val];
            return acc;
        }, Object.create(null));
    }
    
    // [Symbol.asyncIterator]: ...
}