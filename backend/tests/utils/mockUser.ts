export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Default Name',
    email: 'default@example.com',
    avatar: null,
    password: 'defaultPassword',
    block: [],
    statusMessage: null,
    lastSeen: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}