/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LinkAadhaarRequest } from '../models/LinkAadhaarRequest';
import type { ProfileResponse } from '../models/ProfileResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfileService {
    /**
     * Get current profile and KYC status
     * @returns ProfileResponse Current user profile
     * @throws ApiError
     */
    public static getProfile(): CancelablePromise<ProfileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profile',
        });
    }
    /**
     * Link Aadhaar-style KYC using masked storage
     * @returns ProfileResponse Updated KYC profile
     * @throws ApiError
     */
    public static linkAadhaar({
        requestBody,
    }: {
        requestBody: LinkAadhaarRequest,
    }): CancelablePromise<ProfileResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profile/aadhaar/link',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
