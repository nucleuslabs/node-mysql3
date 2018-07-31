import {AnyObject, StringMap, TupleTypes, UnionToIntersection} from './types';

export function setDefaults<T extends object,U extends object[]>(obj: T, ...defaults: U) {
    for(const def of defaults) {
        for(const [k, v] of Object.entries(def)) {
            if((<any>obj)[k] === undefined && v !== undefined) {
                (<any>obj)[k] = v;
            }
        }
    }
    return obj as T & UnionToIntersection<TupleTypes<U>>;
}

export function isPlainObject(obj: any): obj is AnyObject  {
    return isObject(obj) && (
        obj.constructor === Object  // obj = {}
        || obj.constructor === undefined // obj = Object.create(null)
    );
}

export function isObject(obj: any): obj is object {
    return obj !== null && typeof obj === 'object';
}
