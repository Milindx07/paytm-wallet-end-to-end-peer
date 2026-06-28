/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Transaction = {
    id: string;
    type: Transaction.type;
    counterpartyName: string;
    counterpartyEmail: string;
    amountPaise: number;
    amountDisplay: string;
    status: Transaction.status;
    note?: string | null;
    createdAt: string;
};
export namespace Transaction {
    export enum type {
        CREDIT = 'credit',
        DEBIT = 'debit',
    }
    export enum status {
        PENDING = 'pending',
        COMPLETED = 'completed',
        FAILED = 'failed',
    }
}

