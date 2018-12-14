'use strict';

// Unit test the auth process
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const emailService = require('../../../app/services/util/email-service');
const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const { userData, validUserData, invalidUserData } = require('../../mock-data/user-mock-data');
const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE
} = require('../../../constants/table.constants');

const request = supertest(app);

describe('test auth process end-to-end', () => {
  // Ensure db is running and migrations are complete
  let sandbox;
  let userId = 1;
  let verificationCode;

  beforeEach(() => {
    userData.userId = userId;
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, userData);
    sandbox.stub(emailService, 'sendVerificationMail').resolves(Promise.resolve(true));
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    // delete newly created user
    const user = knex(USER_TABLE).where({ userId }).delete();
    const userEmail = knex(USER_EMAIL_TABLE).where({ userId }).delete();
    const userPhone = knex(USER_PHONE_TABLE).where({ userId }).delete();
    const userProfile = knex(USER_PROFILE_TABLE).where({ userId }).delete();
    return Promise.all([user, userEmail, userPhone, userProfile]);
  });

  describe('/api/v1/auth', () => {
    it('/api/v1/auth/register - valid register successful', () => {
      return request
        .post('/api/v1/auth/register')
        .send(validUserData)
        .set('Accept', 'application/json')
        .expect(200)
        .then(res => {
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('body');
          expect(data.body).to.have.property('token');
          expect(data.body).to.have.property('userId');
          userId = data.body.userId;
        });
    });

    it('/api/v1/auth/register - failed if email exists', done => {
      request
        .post('/api/v1/auth/register')
        .send(validUserData)
        .set('Accept', 'application/json')
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

    it('/api/v1/auth/register - failure on invalid data', done => {
      request
        .post('/api/v1/auth/register')
        .send({ invalidUserData })
        .set('Accept', 'application/json')
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

    it('/api/v1/auth/verify - verify email successful', () => {
      const params = {
        verifyType: 'email',
        emailAddress: validUserData.emails[0].emailAddress
      };
      return request
        .post('/api/v1/auth/verify')
        .send(params)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('body');
        });
    });

    it('/api/v1/auth/verify - verify email failed', done => {
      const params = {
        verifyType: 'email',
        emailAddress: 'invalid'
      };
      request
        .post('/api/v1/auth/verify')
        .send(params)
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

    it('/api/v1/auth/verify - verify phone successful', () => {
      const params = {
        verifyType: 'sms',
        phoneNumber: validUserData.phones[0].phoneNumber
      };
      return request
        .post('/api/v1/auth/verify')
        .send(params)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('body');
        });
    }).timeout(30000);

    it('/api/v1/auth/verify - verify phone failed', done => {
      const params = {
        verifyType: 'sms'
      };
      request
        .post('/api/v1/auth/verify')
        .send(params)
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

    it('/api/v1/auth/verify - returns 500 on query error', () => {
      const params = {
        verifyType: 'sms',
        phoneNumber: validUserData.phones[0].phoneNumber
      };
      return request
        .post('/api/v1/auth/verify')
        .send(params)
        .set('Accept', 'application/json')
        .expect(401)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 401);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/auth/verify - returns 422 on invalid verification type', () => {
      const params = {
        verifyType: 'call',
        phoneNumber: validUserData.phones[0].phoneNumber
      };
      return request
        .post('/api/v1/auth/verify')
        .send(params)
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

    it('/api/v1/auth/validate - validate email token successful', () => {
      return knex(USER_EMAIL_TABLE)
        .first()
        .where({
          userId,
          emailAddress: validUserData.emails[0].emailAddress
        })
        .then(fetchedEmail => {
          verificationCode = fetchedEmail.verificationCode;
          return request
            .put(`/api/v1/auth/validate/email/${verificationCode}`)
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
              expect(user).to.have.property('profileId').to.be.a('number');
              expect(user).to.have.property('userId').to.be.a('number');
              expect(user).to.have.property('firstName');
              expect(user).to.have.property('lastName');
              expect(user).to.have.property('status');
              expect(user).to.have.property('primary');
            });
        });
    });

    it('/api/v1/auth/validate - validate email token failed', done => {
      request
        .put('/api/v1/auth/validate/email/invalid')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(404)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('message').to.be.a('string');
          expect(body).to.have.property('status', 404);
          return done();
        });
    });

    it('/api/v1/auth/validate - velidate email token failed if token expired', () => {
      return knex(USER_EMAIL_TABLE)
        .where({
          userId,
          emailAddress: validUserData.emails[0].emailAddress
        })
        .update({
          verificationCode,
          verificationCodeExpiry: moment().subtract(1, 'h').format('YYYY-MM-DD HH:mm:ss')
        })
        .then(() => {
          return request
            .put(`/api/v1/auth/validate/email/${verificationCode}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(422)
            .then(res => {
              const data = res.body;
              expect(data).to.be.an('object');
              expect(data).to.have.property('status', 422);
              expect(data).to.have.property('error', true);
              expect(data).to.have.property('message');
            });
        });
    });

    it('/api/v1/auth/validate - velidate sms token successful', () => {
      return knex(USER_PHONE_TABLE)
        .first()
        .where({
          userId,
          phoneNumber: validUserData.phones[0].phoneNumber
        })
        .then(fetchedPhone => {
          verificationCode = fetchedPhone.verificationCode;
          return request
            .put(`/api/v1/auth/validate/sms/${verificationCode}`)
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
              expect(user).to.have.property('profileId').to.be.a('number');
              expect(user).to.have.property('userId').to.be.a('number');
              expect(user).to.have.property('firstName');
              expect(user).to.have.property('lastName');
              expect(user).to.have.property('status');
              expect(user).to.have.property('primary');
            });
        });
    });

    it('/api/v1/auth/validate - validate sms token failed', done => {
      request
        .put('/api/v1/auth/validate/sms/invalid')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(404)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('message').to.be.a('string');
          expect(body).to.have.property('status', 404);
          return done();
        });
    });

    it('/api/v1/auth/validate - validate sms token failed on wrong verification type', done => {
      request
        .put('/api/v1/auth/validate/call/invalid')
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

    it('/api/v1/auth/validate - velidate sms token failed if token', () => {
      return knex(USER_PHONE_TABLE)
        .where({
          userId,
          phoneNumber: validUserData.phones[0].phoneNumber
        })
        .update({
          verificationCode,
          verificationCodeExpiry: moment().subtract(1, 'h').format('YYYY-MM-DD HH:mm:ss')
        })
        .then(() => {
          return request
            .put(`/api/v1/auth/validate/sms/${verificationCode}`)
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(422)
            .then(res => {
              const data = res.body;
              expect(data).to.be.an('object');
              expect(data).to.have.property('status', 422);
              expect(data).to.have.property('error', true);
              expect(data).to.have.property('message');
            });
        });
    });
  });

  describe('Token Failure tests', () => {
    beforeEach(() => {
      sandbox.restore();
    });

    it('/api/v1/auth/verify - returns failure on invalid', done => {
      const params = {
        verifyType: 'sms',
        phoneNumber: validUserData.phones[0].phoneNumber
      };
      request
        .post('/api/v1/auth/verify')
        .send(params)
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
