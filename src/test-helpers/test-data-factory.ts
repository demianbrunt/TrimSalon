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
      clientId: 'client-1',
      date: new Date(),
      startTime: '10:00',
      endTime: '11:00',
      status: 'scheduled',
      services: [],
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
      description: 'Basic grooming package',
      services: ['service-1'],
      price: 50,
      active: true,
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
      clientId: 'client-1',
      date: new Date(),
      items: [],
      total: 0,
      status: 'draft',
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
