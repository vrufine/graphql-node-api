import * as graphqlFields from 'graphql-fields';
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { PostInstance } from "../../../models/PostModel";
import { Transaction } from "sequelize";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { GraphQLResolveInfo } from 'graphql';
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';

export const postResolvers = {

  Post: {

    author: (
      post,
      args,
      { db, dataloaders: { userLoader } }: { db: DbConnection, dataloaders: DataLoaders },
      info
    ) => {
      return userLoader
        .load({ key: post.get('author'), info })
        .catch(handleError);
    },

    comments: (
      post,
      { first = 10, offset = 0 },
      context: ResolverContext,
      info) => {
      return context.db
        .Comment
        .findAll({
          where: { post: post.get('id') },
          limit: first,
          offset: offset,
          attributes: context.requestedFields.getFields(info)
        })
        .catch(handleError);
    }

  },

  Query: {

    posts: (
      parent,
      { first = 10, offset = 0 },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return context.db
        .Post
        .findAll({
          limit: first,
          offset: offset,
          attributes: context.requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] })
        })
        .catch(handleError);
    },

    post: (
      parent,
      { id },
      context: ResolverContext,
      info
    ) => {
      id = parseInt(id);
      return context.db
        .Post
        .findById(id, {
          attributes: context.requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] })
        })
        .then((post: PostInstance) => {
          throwError(!post, `Post com id ${id} foi encontrado.`);
          return post;
        })
        .catch(handleError);
    }

  },

  Mutation: {

    createPost: compose(...authResolvers)((p, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, i) => {
      input.author = authUser.id;
      return db.sequelize.transaction((t: Transaction) => {
        return db
          .Post
          .create(input, { transaction: t });
      }).catch(handleError);
    }),

    updatePost: compose(...authResolvers)((p, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, i) => {
      id = parseInt(id);
      return db.sequelize.transaction((t: Transaction) => {
        return db.Post
          .findById(id)
          .then((post: PostInstance) => {
            throwError(!post, `Post com id ${id} foi encontrado.`);
            throwError(post.get('author') != authUser.id, `Você só pode editar seus próprios posts.`);
            input.author = authUser.id;
            return post.update(input, { transaction: t });
          })
      }).catch(handleError);
    }),

    deletePost: compose(...authResolvers)((p, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, i) => {
      id = parseInt(id);
      return db.sequelize.transaction((t: Transaction) => {
        return db.Post
          .findById(id)
          .then((post: PostInstance) => {
            throwError(!post, `Post com id ${id} foi encontrado.`);
            throwError(post.get('author') != authUser.id, `Você só pode deletar seus próprios posts.`);
            return post.destroy({ transaction: t }).then(post => !!post);
          });
      }).catch(handleError);
    })

  }

};
