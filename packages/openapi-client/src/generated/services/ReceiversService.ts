/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReceiverResponse } from '../models/ReceiverResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReceiversService {
    /**
     * Resolve a receiver by email or simulated UPI ID
     * @returns ReceiverResponse Receiver verification result
     * @throws ApiError
     */
    public static resolveReceiver({
        identifier,
    }: {
        identifier: string,
    }): CancelablePromise<ReceiverResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/receivers/resolve',
            query: {
                'identifier': identifier,
            },
        });
    }
}
