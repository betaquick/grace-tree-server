'use strict';

// Unit test the auth process
const supertest = require('supertest');
const expect = require('chai').expect;
const bcrypt = require('bcryptjs');

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const { inactiveUserData } = require('../../mock-data/user-mock-data');

const request = supertest(app);

describe('test auth process end-to-end', () => {
  // Ensure db is running and migrations are complete
  const USER_TABLE = 'user';
  const email = 'admin@gracetreeservices.com';
  const password = '1q2w3e4r5t';

  describe('/api/v1/auth/login', () => {
    it('/api/v1/auth/login - valid login successful', done => {
      request
        .post('/api/v1/auth/login')
        .send({ email, password })
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('body');
          expect(data.body).to.have.property('token');
          expect(data.body).to.have.property('user');
          const { user } = data.body;
          expect(user).to.have.property('userId');
          expect(user).to.have.property('email');
          expect(user).to.have.property('first_name');
          expect(user).to.have.property('last_name');
          expect(user).to.have.property('created_at');
          return done();
        });
    }).timeout(0);

    it('/api/v1/auth/login - failure on invalid password', done => {
      request
        .post('/api/v1/auth/login')
        .send({ email, password: '1q23sd' })
        .set('Accept', 'application/json')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property(
            'message',
            'System Error: Password mismatch'
          );
          expect(body).to.have.property('status', 422);
          return done();
        });
    });

    it('/api/v1/auth/login - failure on email with no user', done => {
      request
        .post('/api/v1/auth/login')
        .send({ email: 'email@test.com', password })
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property(
            'message',
            'System Error: User not found'
          );
          expect(body).to.have.property('status', 404);
          return done();
        });
    });

    it('/api/v1/auth/login - failure on no email passed', done => {
      request
        .post('/api/v1/auth/login')
        .send({ password }) // send without email object
        .set('Accept', 'application/json')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('message');
          expect(body).to.have.property('status', 422);
          return done();
        });
    });

    it('/api/v1/auth/login - failure if account is disabled', () => {
      return bcrypt.hash(password, 10)
        .then(hashedPassword => {
          inactiveUserData.password = hashedPassword;
          return knex(USER_TABLE).insert([inactiveUserData]);
        })
        .then(userId => {
          const { email } = inactiveUserData;
          return request
            .post('/api/v1/auth/login')
            .send({ email, password }) // send without email object
            .set('Accept', 'application/json')
            .expect(422)
            .then(res => {
              const { body } = res;
              expect(body).to.be.an('object');
              expect(body).to.have.property('error', true);
              expect(body).to.have.property('message');
              expect(body).to.have.property('status', 422);
              return userId[0];
            });
        })
        .then(userId => {
          // delete newly created user
          return knex(USER_TABLE)
            .where({ userId })
            .delete();
        });
    });
  });
});
