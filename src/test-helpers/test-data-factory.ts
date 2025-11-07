/**
 * Test data factories for common models
 */

export const TestDataFactory = {
  createClient(overrides?: Partial<any>) {
    return {
      id: 'client-1',
      name: 'Test Client',
      email: 'client@test.com',
      phone: '0612345678',
      dogs: [],
      isAnonymized: false,
      ...overrides,
    };
  },

  createDog(overrides?: Partial<any>) {
    return {
      id: 'dog-1',
      name: 'Rex',
      breed: 'Labrador',
      size: 'medium',
      weight: 25,
      notes: '',
      ...overrides,
    };
  },

  createAppointment(overrides?: Partial<any>) {
    return {
      id: 'appointment-1',
      client: this.createClient(),
      dog: this.createDog(),
      startTime: new Date(),
      endTime: new Date(),
      services: [],
      packages: [],
      notes: '',
      ...overrides,
    };
  },

  createService(overrides?: Partial<any>) {
    return {
      id: 'service-1',
      name: 'Bath',
      description: 'Basic bath service',
      duration: 60,
      price: 25,
      active: true,
      ...overrides,
    };
  },

  createPackage(overrides?: Partial<any>) {
    return {
      id: 'package-1',
      name: 'Basic Package',
      services: [],
      ...overrides,
    };
  },

  createExpense(overrides?: Partial<any>) {
    return {
      id: 'expense-1',
      date: new Date(),
      category: 'supplies',
      description: 'Shampoo',
      amount: 15.99,
      ...overrides,
    };
  },

  createInvoice(overrides?: Partial<any>) {
    return {
      id: 'invoice-1',
      invoiceNumber: 'INV-001',
      client: this.createClient(),
      items: [],
      subtotal: 0,
      vatRate: 0,
      vatAmount: 0,
      totalAmount: 0,
      paymentStatus: 'PENDING',
      issueDate: new Date(),
      dueDate: new Date(),
      ...overrides,
    };
  },

  createBreed(overrides?: Partial<any>) {
    return {
      id: 'breed-1',
      name: 'Labrador',
      size: 'medium' as const,
      ...overrides,
    };
  },

  createUser(overrides?: Partial<any>) {
    return {
      uid: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      ...overrides,
    };
  },
};
