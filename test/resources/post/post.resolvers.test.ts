import * as jwt from 'jsonwebtoken';
import { db, chai, app, handleError, expect } from './../../test-utils';
import { PostInstance } from '../../../src/models/PostModel';
import { UserInstance } from '../../../src/models/UserModel';
import { JWT_SECRET } from '../../../src/utils/utils';


describe('Post', () => {
  let token: string;
  let userId: number;
  let postId: number;

  beforeEach(() => {
    return db
      .Comment.destroy({ where: {} })
      .then((rows: number) => db.Post.destroy({ where: {} }))
      .then((rows: number) => db.User.destroy({ where: {} }))
      .then((rows: number) => db.User.create(
        {
          name: 'Rocket',
          email: 'rocket@guardians.com',
          password: '1234'
        }))
      .then((user: UserInstance) => {
        userId = user.get('id');
        token = jwt.sign({ sub: userId }, JWT_SECRET);
        return db.Post.bulkCreate([
          {
            title: 'First post',
            content: 'First post',
            author: userId,
            photo: 'photo_1'
          },
          {
            title: 'Second post',
            content: 'Second post',
            author: userId,
            photo: 'photo_2'
          },
          {
            title: 'Third post',
            content: 'Third post',
            author: userId,
            photo: 'photo_3'
          }
        ])
      })
      .then((posts: PostInstance[]) => {
        postId = posts[0].get('id');
      });
  });//beforeEach

  describe('Queries', () => {

    describe('application/json', () => {

      describe('posts', () => {

        it('should return an array of posts', () => {

          let body = {
            query: `
              query {
                posts {
                  title
                  content
                  photo  
                }
              }
            `
          };
          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList).to.be.an('array');
              expect(postList[0]).to.have.keys('title', 'content', 'photo');
              expect(postList[0]).to.not.have.keys('id', 'createdAt', 'updatedAt', 'comments', 'author')
              expect(postList[0].title).to.equal('First post');
            }).catch(handleError);

        })//should return an array of posts

      })//posts

      describe('post', () => {

        it('should return a single Post', () => {

          let body = {
            query: `
              query getPost($id: ID!) {
                post(id: $id) {
                  title
                  author {
                    name
                    email
                  }
                  comments {
                    comment
                  }
                }
              }
            `,
            variables: {
              id: postId
            }
          };
          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {

              const post = res.body.data.post;
              expect(res.body.data).to.be.an('object');
              expect(res.body.data).to.have.key('post');
              expect(post).to.be.an('object');
              expect(post).to.have.keys('title', 'author', 'comments');
              expect(post).to.not.have.keys('id', 'createdAt', 'updatedAt', 'content')
              expect(post.title).to.equal('First post');
              expect(post.author).to.be.an('object').with.keys('name', 'email');
              expect(post.author).to.be.an('object').with.not.keys('id', 'createdAt', 'updatedAt', 'posts');

            }).catch(handleError);

        });//should return a single Post

      });//post

    });//application/json

    describe('application/graphql', () => {

      describe('posts', () => {

        it('should return an array of posts', () => {

          let query = `
            query {
              posts {
                title
                content
                photo  
              }
            }
          `;

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/graphql')
            .send(query)
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList).to.be.an('array');
              expect(postList[0]).to.have.keys('title', 'content', 'photo');
              expect(postList[0]).to.not.have.keys('id', 'createdAt', 'updatedAt', 'comments', 'author')
              expect(postList[0].title).to.equal('First post');
            }).catch(handleError);

        });//should return an array of posts

        it('should paginate a list of Posts', () => {

          let query = `
            query getPostsList($first: Int, $offset: Int) {
              posts(first: $first, offset: $offset) {
                title
                content
                photo  
              }
            }
          `;

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/graphql')
            .send(query)
            .query({
              variables: JSON.stringify({
                first: 2,
                offset: 1
              })
            })
            .then(res => {
              const postList = res.body.data.posts;
              expect(res.body.data).to.be.an('object');
              expect(postList).to.be.an('array').of.length(2);
              expect(postList[0]).to.have.keys('title', 'content', 'photo');
              expect(postList[0]).to.not.have.keys('id', 'createdAt', 'updatedAt', 'comments', 'author')
              expect(postList[0].title).to.equal('Second post');
            }).catch(handleError);

        })//should paginate a list of Posts

      })//posts

    });//application/graphql

  });//Queries

  describe('Mutations', () => {

    describe('application/json', () => {

      describe('createPost', () => {

        it('should create a new Post', () => {

          const body = {
            query: `
              mutation createNewPost($input: PostInput!) {
                createPost(input: $input) {
                  id
                  title
                  content
                  author {
                    id
                    name
                    email
                  }
                }
              }
            `,
            variables: {
              input: {
                title: 'Fourth post',
                content: 'Fourth content',
                photo: 'photo_4'
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const createdPost = res.body.data.createPost;
              expect(createdPost).to.be.an('object');
              expect(createdPost).to.have.keys('id', 'title', 'content', 'author');
              expect(createdPost.title).to.equal('Fourth post');
              expect(createdPost.content).to.equal('Fourth content');
              expect(parseInt(createdPost.author.id)).to.equal(userId);
            }).catch(handleError);

        });//should create a new Post

      });//createPost

      describe('updatePost', () => {

        it('should update an existing Post', () => {

          const body = {
            query: `
              mutation updateExistingPost($id: ID!, $input: PostInput!) {
                updatePost(id: $id, input: $input) {
                  title
                  content
                  photo
                }
              }
            `,
            variables: {
              id: postId,
              input: {
                title: 'Post updated',
                content: 'Content updated',
                photo: 'photo_updated'
              }
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              const updatedPost = res.body.data.updatePost;
              expect(updatedPost).to.be.an('object');
              expect(updatedPost).to.have.keys('title', 'content', 'photo');
              expect(updatedPost.title).to.equal('Post updated');
              expect(updatedPost.content).to.equal('Content updated');
              expect(updatedPost.photo).to.equal('photo_updated');
            }).catch(handleError);

        });//should update an existing Post

      });//updatePost

      describe('deletePost', () => {

        it('should delete an existing Post', () => {

          const body = {
            query: `
              mutation deleteExistingPost($id: ID!) {
                deletePost(id: $id)
              }
            `,
            variables: {
              id: postId
            }
          };

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body.data).to.have.key('deletePost');
              expect(res.body.data.deletePost).to.be.true;
            }).catch(handleError);

        });//should delete an existing Post

      });//deletePost

    });//application/json

  });//Mutations

});//Post
