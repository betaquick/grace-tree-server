'use strict';

// Unit test the auth process
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const statusTypes = require('@betaquick/grace-tree-constants').StatusTypes;

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const { userData, validUserData } = require('../../mock-data/user-mock-data');
const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE
} = require('../../../constants/table.constants');

const request = supertest(app);

describe('test user process end-to-end', () => {
  // Ensure db is running and migrations are complete
  let sandbox;
  let userId = 1;

  beforeEach(() => {
    userData.userId = userId;
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, userData);
  });

  afterEach(() => {
    sandbox.restore();
  });

  before(() => {
    return request
      .post('/api/v1/auth/register')
      .send(validUserData)
      .set('Accept', 'application/json')
      .expect(200)
      .then(res => {
        const data = res.body;
        userId = data.body.userId;
      });
  });

  after(() => {
    // delete newly created user
    const user = knex(USER_TABLE).where({ userId }).delete();
    const userEmail = knex(USER_EMAIL_TABLE).where({ userId }).delete();
    const userPhone = knex(USER_PHONE_TABLE).where({ userId }).delete();
    const userProfile = knex(USER_PROFILE_TABLE).where({ userId }).delete();
    return Promise.all([user, userEmail, userPhone, userProfile]);
  });

  describe('/api/v1/users', () => {
    it('/api/v1/users/onboarding - return error if email and phone is not verified', done => {
      request
        .get('/api/v1/users/onboarding')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(401)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('message').to.be.a('string');
          expect(body).to.have.property('status', 401);
          return done();
        });
    });

    it('/api/v1/users/onboarding - return success if email and phone is verified', () => {
      const userEmail = knex(USER_EMAIL_TABLE).where({ userId, primary: 1 }).update({ isVerified: true });
      const userPhone = knex(USER_PHONE_TABLE).where({ userId, primary: 1 }).update({ isVerified: true });

      return Promise
        .all([userEmail, userPhone])
        .then(() => {
          return request
            .get('/api/v1/users/onboarding')
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(200)
            .then(res => {
              const data = res.body;
              expect(data).to.be.an('object');
              expect(data).to.have.property('status', 200);
              expect(data).to.have.property('error', false);
              expect(data).to.have.property('body');
              const { user } = data.body;
              expect(user).to.be.an('object');
              expect(user).to.have.property('userId').to.be.a('number');
              expect(user).to.have.property('first_name');
              expect(user).to.have.property('last_name');
              expect(user).to.have.property('email');
            });
        });
    });

    it('/api/v1/users/agreement - return success if agreement is successful', () => {
      return request
        .post('/api/v1/users/agreement')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('body');
          const { user } = data.body;
          expect(user).to.be.an('object');
          expect(user).to.have.property('userId').to.be.a('number');
          expect(user).to.have.property('firstName');
          expect(user).to.have.property('lastName');
          expect(user).to.have.property('email');
          expect(user).to.have.property('status');
        });
    });

    it('/api/v1/users/status - return success if status updated', () => {
      return request
        .put(`/api/v1/users/status/${statusTypes.Ready}`)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('body');
          const { user } = data.body;
          expect(user).to.be.an('object');
          expect(user).to.have.property('userId').to.be.a('number');
          expect(user).to.have.property('firstName');
          expect(user).to.have.property('lastName');
          expect(user).to.have.property('email');
          expect(user).to.have.property('status').equals(statusTypes.Ready);
        });
    });

    it('/api/v1/users/onboarding - return error in agreement if user is inactive', done => {
      knex(USER_TABLE)
        .where({ userId })
        .update({ active: false })
        .then(() => {
          request
            .post('/api/v1/users/agreement')
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(422)
            .end((err, res) => {
              expect(err).to.a.null;
              const { body } = res;
              expect(body).to.be.an('object');
              expect(body).to.have.property('error', true);
              expect(body).to.have.property('message').to.be.a('string');
              expect(body).to.have.property('status', 422);
              return done();
            });
        });
    });

    it('/api/v1/users/status - return error in status if user is inactive', done => {
      request
        .put(`/api/v1/users/status/${statusTypes.Ready}`)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('message').to.be.a('string');
          expect(body).to.have.property('status', 422);
          return done();
        });
    });
  });
});
