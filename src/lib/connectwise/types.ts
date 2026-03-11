// ConnectWise Manage API response types

export type CWCompany = {
  id: number;
  identifier: string;
  name: string;
  status: { id: number; name: string };
  territory?: { id: number; name: string };
  market?: { id: number; name: string };
  phoneNumber?: string;
  website?: string;
  numberOfEmployees?: number;
};

export type CWTicket = {
  id: number;
  summary: string;
  board?: { id: number; name: string };
  status?: { id: number; name: string };
  priority?: { id: number; name: string };
  contact?: { id: number; name: string };
  company?: { id: number; identifier: string; name: string };
  source?: { id: number; name: string };
  closedFlag: boolean;
  _info?: { dateEntered: string; lastUpdated: string };
};

export type CWAgreement = {
  id: number;
  name: string;
  type?: { id: number; name: string };
  company?: { id: number; identifier: string; name: string };
  billAmount?: number;
  startDate?: string;
  endDate?: string;
  cancelledFlag: boolean;
  noEndingDateFlag: boolean;
};

export type CWConfiguration = {
  id: number;
  name: string;
  type?: { id: number; name: string };
  company?: { id: number; identifier: string; name: string };
  manufacturer?: { id: number; name: string };
  model?: string;
  serialNumber?: string;
  contact?: { id: number; name: string };
  warrantyExpirationDate?: string;
};

export type CWProduct = {
  id: number;
  identifier: string;
  description: string;
  category?: { id: number; name: string };
  subcategory?: { id: number; name: string };
  price?: number;
  cost?: number;
  vendor?: { id: number; identifier: string; name: string };
};

export type CWSyncResult = {
  entity: string;
  synced: number;
  errors: number;
  skipped: number;
  duration_ms: number;
};
