"use strict";

import * as fs from 'fs';

export async function pathExists(path): Promise<boolean> {
    try {
        await fsAccess(path, fs.constants.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}

export function createFile(path: string) {
    return nfcall(fs.appendFile, path, '');
}

export function createDirectory(path: string): Promise<any> {
    return nfcall(fs.mkdir, path);
}

// adapted from vs/base/node/pfs.ts  
export function lstat(path: string): Promise<any> {
    return nfcall(fs.lstat, path);
}

export function fsAccess(path: string, checks: number): Promise<any> {
    return nfcall(fs.access, path, checks);
}

// adapted from vs/base/common/async
export function nfcall(fn: Function, ...args: any[]): any {
    return new Promise((c, e) => fn(...args, (err: any, result: any) => err ? e(err) : c(result)));
}