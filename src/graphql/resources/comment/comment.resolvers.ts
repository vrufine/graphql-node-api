import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { Transaction } from "sequelize";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

export const commentResolvers = {

  Comment: {

    user: (
      comment,
      args,
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return context
        .dataloaders
        .userLoader
        .load({ key: comment.get('user'), info })
        .catch(handleError);
    },

    post: (
      comment,
      args,
      context: ResolverContext,
      info
    ) => {
      return context
        .dataloaders
        .postLoader
        .load({ key: comment.get('post'), info })
        .catch(handleError);
    }

  },

  Query: {

    commentsByPost: compose()((
      parent,
      { postId, first = 10, offset = 0 },
      context: ResolverContext,
      info: GraphQLResolveInfo
    ) => {
      return context
        .db
        .Comment
        .findAll({
          where: { post: parseInt(postId) },
          limit: first,
          offset: offset,
          attributes: context.requestedFields.getFields(info, { keep: undefined })
        })
        .catch(handleError);
    })

  },

  Mutation: {

    createComment: compose(...authResolvers)((
      parent,
      { input },
      { db, authUser }: { db: DbConnection, authUser: AuthUser },
      info: GraphQLResolveInfo
    ) => {
      input.user = authUser.id;
      return db.sequelize.transaction((t: Transaction) => {
        return db.Comment.create(input, { transaction: t });
      }).catch(handleError);
    }),

    updateComment: (p, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, i) => {
      return db.sequelize.transaction((t: Transaction) => {
        return db.Comment.findById(parseInt(id))
          .then((comment: CommentInstance) => {
            throwError(!comment, `Comentário com id ${id} não encontrado.`);
            throwError(comment.get('user') !== authUser.id, 'Você só pode editar seus próprios comentários.');
            input.user = authUser.id;
            return comment.update(input, { transaction: t });
          })
      }).catch(handleError);
    },

    deleteComment: compose(...authResolvers)((p, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, i) => {
      return db.sequelize.transaction((t: Transaction) => {
        return db.Comment.findById(parseInt(id))
          .then((comment: CommentInstance) => {
            throwError(!comment, `Comentário com id ${id} não encontrado.`);
            throwError(comment.get('user') !== authUser.id, 'Você só pode deletar seus próprios comentários.');
            return comment.destroy({ transaction: t })
              .then(comment => !!comment);
          })
      }).catch(handleError);
    })

  }

};
