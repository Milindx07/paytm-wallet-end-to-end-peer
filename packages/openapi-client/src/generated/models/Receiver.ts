/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Receiver = {
    userId: string;
    name: string;
    email: string;
    walletId: string;
    upiId?: string | null;
    aadhaarLinked: boolean;
    kycStatus: Receiver.kycStatus;
    riskTier: Receiver.riskTier;
    rails: Array<string>;
    settlement: string;
};
export namespace Receiver {
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

