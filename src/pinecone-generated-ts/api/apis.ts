export * from './indexOperationsApi';
import { IndexOperationsApi } from './indexOperationsApi';
export * from './vectorOperationsApi';
import { VectorOperationsApi } from './vectorOperationsApi';
import * as http from 'http';

export class HttpError extends Error {
    constructor (public response: http.IncomingMessage, public body: any, public statusCode?: number) {
        super('HTTP request failed');
        this.name = 'HttpError';
    }
}

export { RequestFile } from '../model/models';

export const APIS = [IndexOperationsApi, VectorOperationsApi];
