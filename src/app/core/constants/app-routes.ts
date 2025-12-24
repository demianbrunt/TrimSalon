export const APP_ROUTE = {
  appointments: '/admin/appointments',
  appointmentsNew: '/admin/appointments/new',

  clients: '/admin/clients',
  clientsNew: '/admin/clients/new',

  expenses: '/admin/expenses',
  expensesNew: '/admin/expenses/new',

  invoices: '/admin/invoices',
  invoicesNew: '/admin/invoices/new',

  packages: '/admin/packages',
  packagesNew: '/admin/packages/new',

  services: '/admin/services',
  servicesNew: '/admin/services/new',

  settings: '/admin/settings',

  signin: '/admin/signin',
  signedOut: '/admin/signedout',
  forbidden: '/admin/forbidden',
  notFound: '/admin/not-found',
} as const;
