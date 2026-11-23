// Shared between the server admin pages and the client CampusForm.

export type ServiceRow = {
  key: string;
  name: string;
  description: string;
  capacity: string;
  status: string;
};

export type CampusFormValues = {
  id: string;
  name: string;
  shortName: string;
  province: string;
  city: string;
  address: string;
  building: string;
  description: string;
  hours: string;
  rating: number;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  services: ServiceRow[];
};

export function newServiceRow(partial: Partial<ServiceRow> = {}): ServiceRow {
  return {
    key: Math.random().toString(36).slice(2),
    name: '',
    description: '',
    capacity: '',
    status: 'OPEN',
    ...partial,
  };
}
