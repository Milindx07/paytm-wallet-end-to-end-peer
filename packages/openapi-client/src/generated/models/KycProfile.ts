/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type KycProfile = {
    aadhaarLinked: boolean;
    aadhaarMasked?: string | null;
    kycStatus: KycProfile.kycStatus;
    upiId?: string | null;
    bankName: string;
    riskTier: KycProfile.riskTier;
    consentAcceptedAt?: string | null;
};
export namespace KycProfile {
    export enum kycStatus {
        PENDING = 'pending',
        VERIFIED = 'verified',
        REVIEW = 'review',
    }
    export enum riskTier {
        STANDARD = 'standard',
        TRUSTED = 'trusted',
        REVIEW = 'review',
    }
}

