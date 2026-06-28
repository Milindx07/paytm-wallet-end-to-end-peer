/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddMoneyRequest } from '../models/AddMoneyRequest';
import type { WalletResponse } from '../models/WalletResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WalletService {
    /**
     * Get current wallet
     * @returns WalletResponse Wallet summary
     * @throws ApiError
     */
    public static getWallet(): CancelablePromise<WalletResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/wallet',
        });
    }
    /**
     * Add money to current user's wallet
     * @returns WalletResponse Updated wallet
     * @throws ApiError
     */
    public static addMoney({
        requestBody,
        idempotencyKey,
    }: {
        requestBody: AddMoneyRequest,
        /**
         * Optional unique key to make retries safe
         */
        idempotencyKey?: string,
    }): CancelablePromise<WalletResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/wallet/add-money',
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
