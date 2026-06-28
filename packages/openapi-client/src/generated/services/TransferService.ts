/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TransferRequest } from '../models/TransferRequest';
import type { TransferResponse } from '../models/TransferResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransferService {
    /**
     * Send money to another user
     * @returns TransferResponse Transfer completed
     * @throws ApiError
     */
    public static transferMoney({
        idempotencyKey,
        requestBody,
    }: {
        /**
         * Unique request key for safe retries
         */
        idempotencyKey: string,
        requestBody: TransferRequest,
    }): CancelablePromise<TransferResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transfer',
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Business validation failure`,
                409: `Duplicate or in-flight idempotency key`,
            },
        });
    }
}
