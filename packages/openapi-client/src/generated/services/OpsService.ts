/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IsolationDetails } from '../models/IsolationDetails';
import type { OpsSnapshot } from '../models/OpsSnapshot';
import type { RetrySafetyDetails } from '../models/RetrySafetyDetails';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OpsService {
    /**
     * Return backend health and wallet snapshot
     * @returns OpsSnapshot Backend snapshot
     * @throws ApiError
     */
    public static getOpsSnapshot(): CancelablePromise<OpsSnapshot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ops/snapshot',
        });
    }
    /**
     * Explain transaction isolation from backend
     * @returns IsolationDetails Isolation details
     * @throws ApiError
     */
    public static getIsolationDetails(): CancelablePromise<IsolationDetails> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ops/isolation',
        });
    }
    /**
     * Explain Redis idempotency from backend
     * @returns RetrySafetyDetails Retry safety details
     * @throws ApiError
     */
    public static getRetrySafetyDetails(): CancelablePromise<RetrySafetyDetails> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ops/retry-safety',
        });
    }
}
