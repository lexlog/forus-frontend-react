import { ApiResponse, ApiResponseSingle } from '../../dashboard/props/ApiResponses';
import { useState } from 'react';
import ApiRequestService from '../../dashboard/services/ApiRequestService';
import PhysicalCardRequest from '../../dashboard/props/models/PhysicalCardRequest';

export class PhysicalCardsRequestService<T = PhysicalCardRequest> {
    /**
     * @param apiRequest
     */
    public constructor(protected apiRequest: ApiRequestService<T> = new ApiRequestService<T>()) {}

    /**
     * Url prefix
     *
     * @param data
     */
    public prefix = '/platform/vouchers';

    public index(voucher_address: string, data?: object): Promise<ApiResponse<T>> {
        return this.apiRequest.get(`${this.prefix}/${voucher_address}/physical-card-requests`, data);
    }

    public store(voucher_address: string, data: object = {}): Promise<ApiResponseSingle<T>> {
        return this.apiRequest.post(`${this.prefix}/${voucher_address}/physical-card-requests`, data);
    }

    public validate(voucher_address: string, data: object = {}): Promise<ApiResponseSingle<T>> {
        return this.apiRequest.post(`${this.prefix}/${voucher_address}/physical-card-requests/validate`, data);
    }

    public show(voucher_address: string, id: number): Promise<ApiResponseSingle<T>> {
        return this.apiRequest.post(`${this.prefix}/${voucher_address}/physical-card-requests/${id}`);
    }
}

export function usePhysicalCardsRequestService(): PhysicalCardsRequestService {
    return useState(new PhysicalCardsRequestService())[0];
}
