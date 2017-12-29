import { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";

import { ComposableResolver } from "./composable.resolver";
import { ResolverContext } from "../../interfaces/ResolverContextInterface";
import { verifyTokenResolver } from "./verify-token.resolver";

export const authResolver: ComposableResolver<any, ResolverContext> =
  (resolver: GraphQLFieldResolver<any, ResolverContext>): GraphQLFieldResolver<any, ResolverContext> => {
    return (parent, args, context: ResolverContext, info) => {
      if (context.authUser || context.authorization) {
        return resolver(parent, args, context, info);
      }
      throw new Error('Nenhum token foi fornecido!');
    };
  };

export const authResolvers = [authResolver, verifyTokenResolver];
