import { BaseApiService, httpClient } from "@/src/core/api";
import type {
  CustomerAddress,
  CustomerAddressPayload,
} from "../types/customer-address";

export class CustomerAddressService extends BaseApiService {
  constructor() {
    super(httpClient, "/customer-addresses");
  }

  getAll(): Promise<CustomerAddress[]> {
    return this.get<CustomerAddress[]>("", { cache: "no-store" });
  }

  getDefault(): Promise<CustomerAddress | null> {
    return this.get<CustomerAddress | null>("default", { cache: "no-store" });
  }

  create(payload: CustomerAddressPayload): Promise<CustomerAddress> {
    return this.post<CustomerAddress>("", payload);
  }

  update(id: string, payload: Partial<CustomerAddressPayload>): Promise<CustomerAddress> {
    return this.patch<CustomerAddress>(id, payload);
  }

  setDefault(id: string): Promise<CustomerAddress> {
    return this.patch<CustomerAddress>(`${id}/default`, {});
  }

  remove(id: string): Promise<void> {
    return this.delete<void>(id);
  }

  async saveDefault(payload: CustomerAddressPayload): Promise<CustomerAddress> {
    return this.patch<CustomerAddress>("default", { ...payload, isDefault: true });
  }
}

export const customerAddressService = new CustomerAddressService();
