import {AnyObject, StringMap, TupleTypes, UnionToIntersection} from './types';

// https://stackoverflow.com/q/51603250/65387
// https://github.com/Microsoft/TypeScript/pull/21316#issuecomment-359574388
export function setDefaults<T extends AnyObject,U extends AnyObject>(obj: T, defaults: U) : Spread<T,U>;
export function setDefaults<T extends AnyObject,U extends AnyObject[]>(obj: T = Object.create(null), ...defaults: U) {
    for(const def of defaults) {
        for(const [k, v] of Object.entries(def)) {
            if(obj[k] === undefined && v !== undefined) {
                obj[k] = v;
            }
        }
    }
    return obj;
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


// Remove types from T that are assignable to U
type Diff<T, U> = T extends U ? never : T;

// Names of properties in T with types that include undefined
type OptionalPropertyNames<T> =
    { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T];

// Common properties from L and R with undefined in R[K] replaced by type in L[K]
type SpreadProperties<L, R, K extends keyof L & keyof R> =
    { [P in K]: L[P] | Diff<R[P], undefined> };

// Type of { ...L, ...R }
type Spread<L, R> =
    // Properties in L that don't exist in R
    & Pick<L, Diff<keyof L, keyof R>>
    // Properties in R with types that exclude undefined
    & Pick<R, Diff<keyof R, OptionalPropertyNames<R>>>
    // Properties in R, with types that include undefined, that don't exist in L
    & Pick<R, Diff<OptionalPropertyNames<R>, keyof L>>
    // Properties in R, with types that include undefined, that exist in L
    & SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>;