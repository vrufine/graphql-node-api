import { db, handleError, chai, app, expect } from './../../test-utils';
import { UserInstance } from '../../../src/models/UserModel';

describe('Token', () => {

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
      .catch(handleError);
  });//beforeEach

  describe('Mutations', () => {

    describe('application/json', () => {

      describe('createToken', () => {

        it('should return a new valid Token', () => {

          let body = {
            query: `
              mutation createNewToken($email: String!, $password: String!) {
                createToken(email: $email, password: $password) {
                  token
                }
              }
            `,
            variables: {
              email: 'peter@guardians.com',
              password: '1234'
            }
          }

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body.data).to.have.key('createToken');
              expect(res.body.data.createToken).to.have.key('token');
              expect(res.body.data.createToken.token).to.be.string;
              expect(res.body.errors).to.be.undefined;
            })
            .catch(handleError);

        });//should return a new valid Token

        it('should return an error if the password is incorrect', () => {

          let body = {
            query: `
              mutation createNewToken($email: String!, $password: String!) {
                createToken(email: $email, password: $password) {
                  token
                }
              }
            `,
            variables: {
              email: 'peter@guardians.com',
              password: 'WRONG_PASSWORD'
            }
          }

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body).to.have.keys('errors', 'data');
              expect(res.body.data).to.have.key('createToken');
              expect(res.body.data.createToken).to.be.null;
              expect(res.body.errors).to.be.an('array').with.length(1);
              expect(res.body.errors[0].message).to.equal('Autorização negada! E-mail/senha está incorreto.')
            })
            .catch(handleError);

        });//should return an error if the password is incorrect

        it('should return an error if the email dont exist', () => {

          let body = {
            query: `
              mutation createNewToken($email: String!, $password: String!) {
                createToken(email: $email, password: $password) {
                  token
                }
              }
            `,
            variables: {
              email: 'ronan@guardians.com',
              password: 'SOME_PASSWORD'
            }
          }

          return chai.request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(res => {
              expect(res.body).to.have.keys('errors', 'data');
              expect(res.body.data).to.have.key('createToken');
              expect(res.body.data.createToken).to.be.null;
              expect(res.body.errors).to.be.an('array').with.length(1);
              expect(res.body.errors[0].message).to.equal('Autorização negada! E-mail/senha está incorreto.')
            })
            .catch(handleError);

        });//should return an error if the email dont exist

      });//createToken

    });//application/json

  });//Mutations

});
