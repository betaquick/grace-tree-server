'use strict';

// Unit test the auth process
const _ = require('lodash');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const mockDb = require('mock-knex');
const mTracker = mockDb.getTracker();

const emailService = require('../../../app/services/util/email-service');
const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const { userData, activeUserData, invalidUserData } = require('../../mock-data/user-mock-data');

const request = supertest(app);

describe('test users process end-to-end', () => {
  // Ensure db is running and migrations are complete
  const USER_TABLE = 'user';
  let sandbox;
  let user;

  before(() => {
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, userData);
    sandbox.stub(emailService, 'sendInvitationMail').resolves(Promise.resolve(true));
  });

  after(() => {
    sandbox.restore();
  });

  describe('/api/v1/users users endpoints', () => {
    it('/api/v1/users - returns a list of users', done => {
      request
        .get('/api/v1/users')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.users).to.be.an('array');
          expect(data.body.users[0]).to.have.property('userId').to.be.a('number');
          expect(data.body.users[0]).to.have.property('email');
          expect(data.body.users[0]).to.have.property('first_name');
          expect(data.body.users[0]).to.have.property('last_name');
          expect(data.body.users[0]).to.have.property('is_active');
          return done();
        });
    });

    it('/api/v1/user - returns the authenticated user', done => {
      request
        .get('/api/v1/user')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.user).to.be.an('object');
          expect(data.body.user).to.have.property('userId').to.be.a('number');
          expect(data.body.user).to.have.property('email');
          expect(data.body.user).to.have.property('first_name');
          expect(data.body.user).to.have.property('last_name');
          expect(data.body.user).to.have.property('is_active');
          return done();
        });
    });

    it('/api/v1/users - returns success on get user', () => {
      return knex(USER_TABLE)
        .first()
        .select(['userId', 'email', 'first_name', 'last_name', 'phone'])
        .then(fetchedUser => {
          user = fetchedUser;
          return request
            .get(`/api/v1/users/${fetchedUser.userId}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(200)
            .then(res => {
              const { body: data } = res;
              expect(data).to.be.an('object');
              expect(data).to.have.property('error', false);
              expect(data).to.have.property('status', 200);
              expect(data).to.have.property('message').to.be.a('string');
              expect(data.body).to.be.an('object');
              expect(data.body.user).to.have.property('userId').to.be.a('number');
              expect(data.body.user).to.have.property('email');
              expect(data.body.user).to.have.property('first_name');
              expect(data.body.user).to.have.property('last_name');
              expect(data.body.user).to.have.property('is_active');
            });
        });
    });

    it('/api/v1/users - returns 404 on get user if user id is not found', () => {
      return request
        .get('/api/v1/users/-1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(404)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 404);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/users - failure on user creation with invalid fields', done => {
      request
        .post('/api/v1/users')
        .send(invalidUserData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data).to.have.property('error', true);
          return done();
        });
    });

    it('/api/v1/users - success on user creation with valid fields', () => {
      activeUserData.roles = [2, 3];
      delete activeUserData.password;

      return request
        .post('/api/v1/users')
        .send(activeUserData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body).to.be.an('object');
          expect(data.body.user).to.have.property('userId').to.be.a('number');
          expect(data.body.user).to.have.property('email');
          expect(data.body.user).to.have.property('first_name');
          expect(data.body.user).to.have.property('last_name');
          expect(data.body.user).to.have.property('is_active');
          expect(data.body.user).to.have.property('reset_password_token');
          expect(data.body.user).to.have.property('reset_password_expiry');
          return data.body.user.userId;
        })
        .then(userId => {
          // delete newly created user
          const user = knex(USER_TABLE).where({ userId }).delete();
          const user_role = knex('user_role').where({ userId }).delete();
          const activity = knex('activity').where({ userId: userData.userId }).delete();
          return Promise.all([user, user_role, activity]);
        });
    });

    it('/api/v1/users - returns 422 on create user if email has been taken', () => {
      const clonedUser = _.cloneDeep(user);
      delete clonedUser.userId;
      clonedUser.roles = [2, 3];

      return request
        .post('/api/v1/users')
        .send(clonedUser)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/users - returns a failure on user update when invalid data is passed', () => {
      const clonedUser = _.cloneDeep(user);
      clonedUser.email = 1;
      return request
        .put('/api/v1/users/' + clonedUser.userId)
        .send(clonedUser)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/users - returns 401 on user update with wrong/no password', () => {
      const clonedUser = _.cloneDeep(user);
      clonedUser.roles = [1];
      return request
        .put('/api/v1/users/' + clonedUser.userId)
        .send(clonedUser)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(401)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 401);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/users - returns a success on user update with no role', () => {
      const clonedUser = _.cloneDeep(user);
      clonedUser.roles = [1];
      clonedUser.password = '1q2w3e4r5t';
      clonedUser.new_password = 'fake';
      clonedUser.confirm_password = 'fake';
      return request
        .put('/api/v1/users/' + clonedUser.userId)
        .send(clonedUser)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.user).to.have.property('userId').to.be.a('number');
          expect(data.body.user).to.have.property('email');
          expect(data.body.user).to.have.property('first_name');
          expect(data.body.user).to.have.property('last_name');
          expect(data.body.user).to.have.property('is_active');
        });
    });

    it('/api/v1/users - returns a success on user update with password change', () => {
      const clonedUser = _.cloneDeep(user);
      clonedUser.password = 'fake';
      clonedUser.new_password = '1q2w3e4r5t';
      clonedUser.confirm_password = '1q2w3e4r5t';

      return request
        .put('/api/v1/users/' + clonedUser.userId)
        .send(clonedUser)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.user).to.have.property('userId').to.be.a('number');
          expect(data.body.user).to.have.property('email');
          expect(data.body.user).to.have.property('first_name');
          expect(data.body.user).to.have.property('last_name');
          expect(data.body.user).to.have.property('is_active');
        });
    });

    it('/api/v1/users - returns a success on user update', () => {
      const clonedUser = _.cloneDeep(user);
      clonedUser.roles = [1];
      clonedUser.password = '1q2w3e4r5t';
      return request
        .put('/api/v1/users/' + clonedUser.userId)
        .send(clonedUser)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.user).to.have.property('userId').to.be.a('number');
          expect(data.body.user).to.have.property('email');
          expect(data.body.user).to.have.property('first_name');
          expect(data.body.user).to.have.property('last_name');
          expect(data.body.user).to.have.property('is_active');
        });
    });

    it('/api/v1/users - returns 404 error on user update for user id not found', () => {
      const clonedUser = _.cloneDeep(user);
      clonedUser.roles = [1];
      // make data with negative Id
      return request
        .put('/api/v1/users/-1')
        .send(clonedUser)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(404)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 404);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/users - returns success on delete user', () => {
      // make data with negative Id
      return request
        .delete('/api/v1/users/-1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/users - returns 422 error on delete user if user id is invalid', () => {
      // make data with negative Id
      return request
        .delete('/api/v1/users/invalid')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });
  });

  describe('Failure tests', () => {
    beforeEach(() => {
      // mock db
      mockDb.mock(knex);
      mTracker.install();
      mTracker.on('query', query => query.reject(new Error()));
    });

    afterEach(() => {
      mTracker.uninstall();
      mockDb.unmock(knex);
    });

    it('/api/v1/users - returns a 500 error for listing users', done => {
      request
        .get('/api/v1/users')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });

    it('/api/v1/users - returns a 500 error for deleting users', done => {
      request
        .delete('/api/v1/users/-1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });

    it('/api/v1/users - returns failure if not authenticated', done => {
      request
        .get('/api/v1/users')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 401);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });


    it('/api/v1/users - returns 500 on query error', () => {
      return request
        .get('/api/v1/user')
        .set('Accept', 'application/json')
        .set('Authorization', 'aut')
        .expect(500)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/users - returns failure on no token', done => {
      request
        .get('/api/v1/user')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 401);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });
  });

  describe('Token Failure tests', () => {
    beforeEach(() => {
      sandbox.restore();
    });

    it('/api/v1/users - returns failure on invalid', done => {
      request
        .get('/api/v1/users')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(401)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 401);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });

    it('/api/v1/users - returns failure on invalid', done => {
      request
        .get('/api/v1/user')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(401)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 401);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });

  });
});
