'use strict';

// Unit test the auth process
const _ = require('lodash');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const {UserStatus} = require('@betaquick/grace-tree-constants');

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const {
  validUserData,
  completeUserData,
  invalidUserData,
  validBusinessData,
  invalidBusinessData,
  validDeliveryData
} = require('../../mock-data/user-mock-data');
const userDt = require('../../../app/services/user/user-data');
const emailService = require('../../../app/services/util/email-service');

const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE,
  USER_ADDRESS_TABLE,
  USER_PRODUCT_TABLE,
  USER_COMPANY_TABLE,
  COMPANY_ADDRESS_TABLE,
  COMPANY_PROFILE_TABLE,
  PRODUCT_TABLE
} = require('../../../constants/table.constants');

const request = supertest(app);

describe('test user process end-to-end', function() {
  this.timeout(5000);
  // Ensure db is running and migrations are complete
  let userData;

  before(() => {
    sinon.stub(emailService, 'sendVerificationMail');
    return request
      .post('/api/v1/auth/register')
      .send(validUserData)
      .set('Accept', 'application/json')
      .expect(200)
      .then(res => {
        userData = _.get(res, 'body.body.user');
        // Allows middleware to always succeed
        sinon.stub(jwt, 'verify').callsArgWith(2, null, userData);
      });
  });

  after(() => {
    sinon.restore();
    // delete newly created user
    return knex(USER_TABLE).where('userId', userData.userId).delete()
      .then(() => knex(USER_EMAIL_TABLE).where('userId', userData.userId).delete())
      .then(() => knex(USER_PHONE_TABLE).where('userId', userData.userId).delete())
      .then(() => knex(USER_PROFILE_TABLE).where('userId', userData.userId).delete());
  });

  describe('User api testing', () => {
    it('/api/v1/user/onboarding - return error if email and phone is not verified', done => {
      request
        .get('/api/v1/user/onboarding')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(401)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('message', 'Please verify your email and phone');
          expect(body).to.have.property('status', 401);
          return done();
        });
    });

    describe('User testing - Active false', () => {
      before(() => {
        return knex(USER_TABLE)
          .where({ userId: userData.userId})
          .update({ active: false });
      });

      after(() => {
        return knex(USER_TABLE)
          .where({ userId: userData.userId })
          .update({ active: true });
      });

      it('/api/v1/user/onboarding - return error in agreement if user is inactive', done => {
        request.post('/api/v1/user/agreement')
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(422)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', true);
            expect(body).to.have.property('message').to.match(/User\'s account has been disabled./);
            expect(body).to.have.property('status', 422);
            return done();
          });
      });

      it('/api/v1/user/status - return error in status if user is inactive', done => {
        request
          .put(`/api/v1/user/status/${UserStatus.Ready}`)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(422)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', true);
            expect(body).to.have.property('message').to.match(/User\'s account has been disabled./);
            expect(body).to.have.property('status', 422);
            return done();
          });
      });
    });

    describe('User testing - Verified true', () => {
      before(() => {
        return knex(USER_EMAIL_TABLE)
          .where({ userId: userData.userId, primary: 1 })
          .update({ isVerified: true })
          .then(() => knex(USER_PHONE_TABLE)
            .where({ userId: userData.userId, primary: 1 })
            .update({ isVerified: true }));
      });
      after(() => {
        return knex(USER_EMAIL_TABLE)
          .where({ userId: userData.userId, primary: 1 })
          .update({ isVerified: false })
          .then(() => knex(USER_PHONE_TABLE)
            .where({ userId: userData.userId, primary: 1 })
            .update({ isVerified: false }));
      });

      it('/api/v1/user/onboarding - return success if email and phone is verified', () => {
        return request
          .get('/api/v1/user/onboarding')
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('body');
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('message', 'Onboarding loaded successful');
            const { user } = data.body;
            expect(user).to.be.an('object');
            expect(user).to.have.property('firstName');
            expect(user).to.have.property('lastName');
          });
      });

      it('/api/v1/user/agreement - return success if agreement is successful', () => {
        return request
          .post('/api/v1/user/agreement')
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

      it('/api/v1/user/status - return success if status updated', () => {
        return request
          .put(`/api/v1/user/status/${UserStatus.Ready}`)
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
            expect(user).to.have.property('status').equals(UserStatus.Ready);
          });
      });

      it('/api/v1/user/status - return failure if status doesn\'t exist', done => {
        request
          .put('/api/v1/user/status/invalid')
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(422)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', true);
            expect(body).to.have.property('message')
              .to.match(/Validation Error: child "status" fails because \["status" must be one of \[Pause, Ready, Stop\]\]/);
            expect(body).to.have.property('status', 422);
            return done();
          });
      });

      it('/api/v1/user - return success if user profile is valid', () => {
        return request
          .put('/api/v1/user')
          .send(completeUserData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('body');
            expect(data.body).to.have.property('user');

            return data.body.user;
          }).then(() => {
            return knex(USER_ADDRESS_TABLE).where('userId', userData.userId).delete();
          });
      });

      it('/api/v1/user - return failure if user profile is invalid', done => {
        request
          .put('/api/v1/user')
          .send(invalidUserData)
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

      it('/api/v1/user - return success if business info is valid', () => {
        return request
          .post('/api/v1/user/business')
          .send(validBusinessData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('body');
            expect(data.body).to.have.property('company');
            const { company } = data.body;
            return company.companyId;
          }).then(companyId => {
            return knex(COMPANY_ADDRESS_TABLE).where('companyId', companyId).delete()
              .then(() => knex(USER_COMPANY_TABLE).where('userId', userData.userId).delete())
              .then(() => knex(COMPANY_PROFILE_TABLE).where('companyId', companyId).delete());
          });
      });

      it('/api/v1/user - return failure if business info is invalid', done => {
        request
          .post('/api/v1/user/business')
          .send(invalidBusinessData)
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

      describe('Failure tests', () => {
        beforeEach(() => {
          sinon.stub(userDt, 'updateUserByParams').resolves(Promise.reject(new Error()));
        });

        afterEach(() => {
          sinon.restore();
        });

        it('/api/v1/user/agreement - return failure if query failed', done => {
          request
            .post('/api/v1/user/agreement')
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(500)
            .end((err, res) => {
              expect(err).to.a.null;
              const { body } = res;
              expect(body).to.be.an('object');
              expect(body).to.have.property('error', true);
              expect(body).to.have.property('message').to.be.a('string');
              expect(body).to.have.property('status', 500);
              return done();
            });
        });
      });
    });

    describe('Add user delivery info', () => {
      let status = false;

      beforeEach(() => {
        sinon.stub(jwt, 'verify').callsArgWith(2, null, userData);
        return knex(PRODUCT_TABLE)
          .where({
            active: true
          })
          .then(products => {
            products.forEach(product => {
              const { productId } = product;
              status = !status;
              product = {
                productId,
                status
              };
              validDeliveryData.userProducts.push(product);
            });
            return products;
          });
      });

      afterEach(() => {
        // remove verification
        sinon.restore();
      });

      it('/api/v1/user - return success if delivery info is valid', () => {
        return request
          .post('/api/v1/user/new-delivery-info')
          .send(validDeliveryData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('body');
            expect(data.body).to.have.property('delivery');
            return data.body.delivery;
          }).then(() => {
            return knex(USER_ADDRESS_TABLE).where('userId', userData.userId).delete()
              .then(() => knex(USER_PRODUCT_TABLE).where('userId', userData.userId).delete());
          });
      });

      it('/api/v1/user - return failure if delivery info is invalid', done => {
        request
          .post('/api/v1/user/new-delivery-info')
          .send(invalidBusinessData)
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

});

