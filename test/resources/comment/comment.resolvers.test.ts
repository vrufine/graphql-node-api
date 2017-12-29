import * as jwt from 'jsonwebtoken';
import { db, chai, app, handleError, expect } from './../../test-utils';
import { PostInstance } from '../../../src/models/PostModel';
import { UserInstance } from '../../../src/models/UserModel';
import { JWT_SECRET } from '../../../src/utils/utils';
import { CommentInstance } from '../../../src/models/CommentModel';

describe('Comment', () => {

  let token: string;
  let userId: number;
  let postId: number;
  let commentId: number;

  beforeEach(() => {
    return db
      .Comment.destroy({ where: {} })
      .then((rows: number) => db.Post.destroy({ where: {} }))
      .then((rows: number) => db.User.destroy({ where: {} }))
      .then((rows: number) => db.User.create(
        {
          name: 'Peter Quill',
          email: 'peter@guardians.com',
          password: '1234'
        }))
      .then((user: UserInstance) => {
        userId = user.get('id');
        token = jwt.sign({ sub: userId }, JWT_SECRET);
        return db.Post.create(
          {
            title: 'First post',
            content: 'First post',
            author: userId,
            photo: 'photo_1'
          }
        )
      })
      .then((post: PostInstance) => {
        postId = post.get('id');

        return db
          .Comment
          .bulkCreate([
            {
              comment: 'First comment',
              user: userId,
              post: postId
            },
            {
              comment: 'Second comment',
              user: userId,
              post: postId
            },
            {
              comment: 'Third comment',
              user: userId,
              post: postId
            }
          ])
      })
      .then((comments: CommentInstance[]) => {
        commentId = comments[0].get('id');
      });
  });//beforeEach

  describe('Queries', () => {

    describe('application/json', () => {

      describe('commentsByPost', () => {

        it('should return a list of Comments', () => {

          let body = {
            query: `
                query getCommentsByPost($postId: ID!, $first: Int, $offset: Int) {
                  commentsByPost(postId: $postId, first: $first, offset: $offset) {
                    comment
                    user {
                      id
                    }
                    post {
                      id
                    }
                  }
                }
              `,
            variables: {
              postId: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const commentsList = res.body.data.commentsByPost;
              expect(res.body.data).to.be.an('object');
              expect(commentsList).to.be.an('array');
              expect(commentsList[0]).to.not.have.keys('id', 'createdAt', 'updatedAt')
              expect(commentsList[0]).to.have.keys('comment', 'user', 'post');
              expect(parseInt(commentsList[0].user.id)).to.equal(userId);
              expect(parseInt(commentsList[0].post.id)).to.equal(postId);
            })
            .catch(handleError);

        })//should return a list of Comments

      });//commentsByPost

    });//application/json

  });//Queries

  describe('Mutations', () => {
    
    describe('application/json', () => {
    
      describe('createComment', () => {
    
        it('should create a new Comment', () => {

          let body = {
            query: `
                mutation createNewComment($input: CommentInput!) {
                  createComment(input: $input) {
                    comment
                    user {
                      id
                      name
                    }
                    post {
                      id
                      title
                    }
                  }
                }
              `,
            variables: {
              input: {
                comment: 'New comment',
                post: postId
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const createdComment = res.body.data.createComment;
              expect(res.body.data).to.be.an('object');
              expect(res.body.data).to.have.key('createComment');
              expect(createdComment).to.have.keys('comment', 'user', 'post');
              expect(parseInt(createdComment.user.id)).to.equal(userId);
              expect(parseInt(createdComment.post.id)).to.equal(postId);
              expect(createdComment.user.name).to.equal('Peter Quill');
              expect(createdComment.post.title).to.equal('First post');
            })
            .catch(handleError);
          
        });//should create a new Comment
        
      });//createComment

      describe('updateComment', () => {
    
        it('should update an existing Comment', () => {

          let body = {
            query: `
                mutation updateExistingComment($id: ID!, $input: CommentInput!) {
                  updateComment(id: $id, input: $input) {
                    id
                    comment
                  }
                }
              `,
            variables: {
              id: commentId,
              input: {
                comment: 'Updated comment',
                post: postId
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const updatedComment = res.body.data.updateComment;
              expect(res.body.data).to.be.an('object');
              expect(res.body.data).to.have.key('updateComment');
              expect(updatedComment).to.be.an('object');
              expect(updatedComment).to.have.keys('id', 'comment');
              expect(updatedComment.comment).to.equal('Updated comment');
            })
            .catch(handleError);
          
        });//should update an existing Comment
        
      });//updateComment

      describe('deleteComment', () => {
    
        it('should delete an existing Comment', () => {

          let body = {
            query: `
                mutation deleteExistingComment($id: ID!) {
                  deleteComment(id: $id)
                }
              `,
            variables: {
              id: commentId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body.data).to.be.an('object');
              expect(res.body.data).to.have.key('deleteComment');
              expect(res.body.data.deleteComment).to.be.true;
            })
            .catch(handleError);
          
        });//should delete an existing Comment
        
      });//deleteComment
      
    });//application/json

  });//Mutations

})
