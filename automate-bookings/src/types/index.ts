export type BillingType = {
  [key: string]: string;
};

export type Billing = {
  companyId: string;
  projectId: string;
  id: string;
  date: string;
  duration: string;
  description: string;
  typeId: string;
  option: string;
  title: string;
};

export type Project = {
  id: string;
  name: string;
  companyId: string;
  billings: Billing[] | null;
};

export type Company = {
  id: string;
  name: string;
  projects: Project | null;
};

export type BillingInfo = {
  companies: Company[];
  projects: Project[];
  billings: Billing[] | null;
  billingTypes: BillingType;
};

export type PendingEntry = {
  date: string;
  description: string;
  duration: string;
  typeId: string;
} & Billing;

export type MemoizedData = {
  [key: string]: Billing | null;
};
