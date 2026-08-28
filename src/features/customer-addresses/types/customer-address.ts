export interface CustomerAddress {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  address: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressPayload {
  recipientName: string;
  phone: string;
  address: string;
  isDefault?: boolean;
}
