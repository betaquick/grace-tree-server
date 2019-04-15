'use strict';

// Unit test the auth process
const _ = require('lodash');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { UserStatus } = require('@betaquick/grace-tree-constants');

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const {
  validUserData,
  completeUserData,
  invalidUserData,
  validBusinessData,
  invalidBusinessData,
  validDeliveryData,
  locationServiceMock,
  invalidCoordinatesData,
  validAddressData,
  inValidAddressData
} = require('../../mock-data/user-mock-data');
const userDt = require('../../../app/services/user/user-data');
const { transporter } = require('../../../app/services/messaging/email-service');
const { twilioClient } = require('../../../app/services/messaging/sms-service');
const { googleMapsClient } = require('../../../app/services/location/location-service');
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
    sinon.stub(transporter, 'sendMail').resolves(true);
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
      .then(() => knex(USER_PROFILE_TABLE).where('userId', userData.userId).delete())
      .then(() => knex(USER_ADDRESS_TABLE).where('userId', userData.userId).delete());
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
          .where({ userId: userData.userId })
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
        sinon.restore();
        sinon.stub(twilioClient.messages, 'create').resolves(true);
        sinon.stub(transporter, 'sendMail').resolves(true);
        sinon.stub(jwt, 'verify').callsArgWith(2, null, userData);
        sinon.stub(googleMapsClient, 'geocode').returns(locationServiceMock);

        return knex(USER_EMAIL_TABLE)
          .where({ userId: userData.userId, primary: 1 })
          .update({ isVerified: true })
          .then(() => knex(USER_PHONE_TABLE)
            .where({ userId: userData.userId, primary: 1 })
            .update({ isVerified: true }));
      });
      after(() => {
        sinon.restore();

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
            expect(user).to.be.a('number');

            // expect(user).to.be.an('object');
            // expect(user).to.have.property('userId').to.be.a('number');
            // expect(user).to.have.property('firstName');
            // expect(user).to.have.property('lastName');
            // expect(user).to.have.property('email');
            // expect(user).to.have.property('status');
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
            expect(user.profile).to.have.property('status').equals(UserStatus.Ready);
            sinon.assert.callCount(transporter.sendMail, 1);
            setTimeout(() => sinon.assert.callCount(twilioClient.messages.create, 1), 4000);
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
              .to
              .match(
                /Validation Error: child "status" fails because \["status" must be one of \[Pause, Ready, Stop\]\]/
              );
            expect(body).to.have.property('status', 422);
            return done();
          });
      });

      it('/api/v1/user - return success if user profile is valid', () => {
        return request
          .put('/api/v1/user/profile')
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

            const { user } = data.body;
            // expect(user.addresses).to.be.an('array');
            expect(user.phones).to.be.a('array');
            expect(user.emails).to.be.a('array');
            // expect(user.agreement).to.be.a('number');

            return user;
          });
      });

      it('/api/v1/user - return failure if user profile is invalid', done => {
        request
          .put('/api/v1/user/profile')
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

      it('/api/v1/user - return success if company info is valid', () => {
        return request
          .post('/api/v1/user/company')
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
          });
      });

      it('/api/v1/user - return failure if company info is invalid', done => {
        request
          .post('/api/v1/user/company')
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

      it('/api/v1/user - return company information', () => {
        return request
          .get('/api/v1/user/company')
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('body');
            expect(data).to.have.property('error', false);
            expect(data.body).to.have.property('company');
            const { company } = data.body;
            expect(company).to.be.an('object');
            expect(company).to.have.property('companyId').to.be.a('number');
            expect(company).to.have.property('companyName').to.be.a('string');
            expect(company).to.have.property('website').to.be.a('string');
            expect(company).to.have.property('companyAddressId').to.be.a('number');
            expect(company).to.have.property('companyAddress').to.be.a('string');
            expect(company).to.have.property('city').to.be.a('string');
            expect(company).to.have.property('state').to.be.a('string');
            expect(company).to.have.property('zip').to.be.a('string');
          });
      });

      it('/api/v1/user - return success if company info updated successfully', () => {
        return knex(COMPANY_PROFILE_TABLE)
          .select(`${COMPANY_PROFILE_TABLE}.companyId`, 'companyName', 'website',
            'companyAddressId', 'companyAddress', 'city', 'state', 'zip')
          .orderBy(`${COMPANY_PROFILE_TABLE}.companyId`, 'desc')
          .first()
          .join(COMPANY_ADDRESS_TABLE, `${COMPANY_PROFILE_TABLE}.companyId`, '=', `${COMPANY_ADDRESS_TABLE}.companyId`)
          .then(company => {
            return request
              .put('/api/v1/user/company')
              .send({ company, user: completeUserData })
              .set('Accept', 'application/json')
              .set('Authorization', 'auth')
              .expect(200);
          })
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('body');
            expect(data.body).to.have.property('company');
            expect(data.body).to.have.property('user');
            const { company, user } = data.body;
            expect(company).to.be.an('object');
            expect(company).to.have.property('companyId').to.be.a('number');
            expect(company).to.have.property('companyName').to.be.a('string');
            expect(company).to.have.property('website').to.be.a('string');
            expect(company).to.have.property('companyAddressId').to.be.a('number');
            expect(company).to.have.property('companyAddress').to.be.a('string');
            expect(company).to.have.property('city').to.be.a('string');
            expect(company).to.have.property('state').to.be.a('string');
            expect(company).to.have.property('zip').to.be.a('string');
            // expect(user).to.have.property('userId').to.be.a('number');
            expect(user).to.have.property('firstName');
            expect(user).to.have.property('lastName');
            expect(user).to.have.property('email');

            return company.companyId;
          })
          .then(companyId => {
            return knex(COMPANY_ADDRESS_TABLE).where('companyId', companyId).delete()
              .then(() => knex(USER_COMPANY_TABLE).where('userId', userData.userId).delete())
              .then(() => knex(COMPANY_PROFILE_TABLE).where('companyId', companyId).delete());
          });
      });

      it('/api/v1/user - return failure if company info is invalid', done => {
        request
          .put('/api/v1/user/company')
          .send({ company: invalidBusinessData, user: completeUserData })
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

      it('/api/v1/user/address - return success if address info is valid and lng/lat is not provided', () => {
        return request
          .put('/api/v1/user/address')
          .send(validAddressData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('body');
            expect(data.body).to.have.property('longitude');
            expect(data.body).to.have.property('latitude');
            setTimeout(() => sinon.assert.callCount(googleMapsClient.geocode, 1), 4000);

            return data;
          });
      });

      it('/api/v1/user/address - return success if address info is valid and lng/lat is provided', done => {
        const addressData = Object.assign({
          longitude: 151.235260,
          latitude: -33.737885
        }, validAddressData);

        request
          .put('/api/v1/user/address')
          .send(addressData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('body');
            expect(data.body).to.have.property('longitude', 151.235260);
            expect(data.body).to.have.property('latitude', -33.737885);
            setTimeout(() => sinon.assert.callCount(googleMapsClient.geocode, 0), 1000);

            return data;
          });
        done();
      });

      it('/api/v1/user/address - Fails if address info is invalid', done => {
        request
          .put('/api/v1/user/address')
          .send(inValidAddressData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(422)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 422);
            expect(data).to.have.property('error', true);
            return data;
          });
        done();
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

      beforeEach(() => {
        sinon.stub(googleMapsClient, 'geocode').returns(locationServiceMock);

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
              validDeliveryData.userProducts = [];
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
            setTimeout(() => sinon.assert.callCount(googleMapsClient.geocode, 1), 4000);
            return data.body.delivery;
          });
      });

      it('/api/v1/user - return success if delivery info is valid and lng/lat is provided', done => {
        const deliveryData = Object.assign({}, validDeliveryData);
        const addressData = Object.assign({
          longitude: 151.235260,
          latitude: -33.737885
        }, deliveryData.address);
        deliveryData.address = addressData;

        request
          .post('/api/v1/user/new-delivery-info')
          .send(deliveryData)
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
            setTimeout(() => sinon.assert.callCount(googleMapsClient.geocode, 0), 1000);
            return data.body.delivery;
          });
        done();
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

      it('/api/v1/user - returns a list of user products', done => {
        request
          .get('/api/v1/user/products')
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
            expect(data.body.userProducts).to.be.an('array');
            const { userProducts } = data.body;
            expect(userProducts[0]).to.have.property('productId').to.be.a('number');
            expect(userProducts[0]).to.have.property('productCode');
            expect(userProducts[0]).to.have.property('productDesc');
            expect(userProducts[0]).to.have.property('active');
            expect(userProducts[0]).to.have.property('userProductId').to.be.a('number');
            expect(userProducts[0]).to.have.property('userId').to.be.a('number');
            expect(userProducts[0]).to.have.property('productId').to.be.a('number');
            expect(userProducts[0]).to.have.property('status').to.be.a('number');
            return done();
          });
      });

      it('/api/v1/user - return success if user products is valid', () => {
        return request
          .put('/api/v1/user/products')
          .send(validDeliveryData.userProducts)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('body');
            expect(data.body).to.have.property('userProducts').to.be.an('array');
            const { userProducts } = data.body;
            expect(userProducts[0]).to.have.property('userProductId').to.be.a('number');
            expect(userProducts[0]).to.have.property('userId').to.be.a('number');
            expect(userProducts[0]).to.have.property('productId').to.be.a('number');
            expect(userProducts[0]).to.have.property('status').to.be.a('number');
            return data.body;
          }).then(() => knex(USER_PRODUCT_TABLE).where('userId', userData.userId).delete());
      });

      it('/api/v1/user - return failure if delivery info is invalid', done => {
        request
          .put('/api/v1/user/products')
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

    describe('Add user delivery info', () => {
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

      beforeEach(() => {
        locationServiceMock.asPromise = () => invalidCoordinatesData;
        sinon.stub(googleMapsClient, 'geocode').returns(locationServiceMock);
        sinon.stub(jwt, 'verify').callsArgWith(2, null, userData);
      });

      afterEach(() => {
        // remove verification
        sinon.restore();
      });

      it('/api/v1/user - return failure if user address is invalid', () => {
        return request
          .post('/api/v1/user/new-delivery-info')
          .send(validDeliveryData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(422)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 422);
            expect(data).to.have.property('error', true);
            expect(data).to.have.property('body', 'The address you entered is invalid');
          });
      });
    });
  });
});

