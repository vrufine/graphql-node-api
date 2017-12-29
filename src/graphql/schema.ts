import { makeExecutableSchema } from 'graphql-tools';
import { merge } from 'lodash';

import { Query } from './Query';
import { Mutation } from './Mutation';

import { userTypes } from './resources/user/user.schema';
import { postTypes } from './resources/post/post.schema';
import { tokenTypes } from './resources/token/token.schema';
import { commentTypes } from './resources/comment/comment.schema';

import { commentResolvers } from './resources/comment/comment.resolvers';
import { postResolvers } from './resources/post/post.resolvers';
import { userResolvers } from './resources/user/user.resolvers';
import { tokenResolvers } from './resources/token/token.resolvers';

const resolvers = merge(
  commentResolvers,
  postResolvers,
  tokenResolvers,
  userResolvers
);

const SchemaDefinition = `
  type Schema {
    query: Query,
    mutation: Mutation
  }
`;

export default makeExecutableSchema({
  typeDefs: [
    SchemaDefinition,
    Query,
    Mutation,
    commentTypes,
    postTypes,
    tokenTypes,
    userTypes
  ],
  resolvers
});
