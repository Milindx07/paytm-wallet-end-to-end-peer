/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TransactionsResponse } from '../models/TransactionsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransactionsService {
    /**
     * List wallet transactions
     * @returns TransactionsResponse Recent transactions
     * @throws ApiError
     */
    public static listTransactions({
        limit = 20,
    }: {
        limit?: number,
    }): CancelablePromise<TransactionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions',
            query: {
                'limit': limit,
            },
        });
    }
}
