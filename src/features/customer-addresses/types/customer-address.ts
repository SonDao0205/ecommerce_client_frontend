export interface CustomerAddress {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  email: string | null;
  address: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressPayload {
  recipientName: string;
  phone: string;
  email?: string;
  address: string;
  isDefault?: boolean;
}
