export interface Price {
  id?: string;
  amount: number;
  fromDate: Date;
  toDate?: Date;
  deletedAt?: Date;
}
