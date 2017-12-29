const userTypes = `
  type User {
    id: ID!
    name: String!
    email: String!
    photo: String
    createdAt: String!
    updatedAt: String!
    posts(first: Int, offset: Int): [Post!]!
  }

  input UserCreateInput {
    name: String!
    email: String!
    password: String!
  }

  # Input para atualizar informações de um usuário
  input UserUpdateInput {
    name: String!
    email: String!
    photo: String!
  }

  # Input para alterar a senha de um usuário
  input UserUpdatePasswordInput {
    password: String!
  }
`;

const userQueries = `
  users(first: Int, offset: Int): [User!]!
  user(id: ID!): User
  currentUser: User
`;

const userMutations = `
  createUser(input: UserCreateInput!): User
  updateUser(input: UserUpdateInput!): User
  updateUserPassword(input: UserUpdatePasswordInput!): Boolean
  deleteUser: Boolean
`;

export {
  userTypes,
  userQueries,
  userMutations
}
