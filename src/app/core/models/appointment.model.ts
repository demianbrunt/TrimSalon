import { Client } from './client.model';
import { Dog } from './dog.model';
import { Package } from './package.model';
import { Service } from './service.model';

export interface Appointment {
  id?: string;
  client: Client;
  dog: Dog;
  services?: Service[];
  packages?: Package[];
  startTime?: Date;
  endTime?: Date;
  notes?: string;
}
