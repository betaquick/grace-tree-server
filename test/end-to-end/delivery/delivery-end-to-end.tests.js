'use strict';
const _ = require('lodash');
const supertest = require('supertest');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const expect = require('chai').expect;

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE,
  COMPANY_ADDRESS_TABLE,
  COMPANY_PROFILE_TABLE,
  DELIVERY_TABLE,
  USER_DELIVERY_TABLE
} = require('../../../constants/table.constants');

const {
  companyUserData,
  validCompanyData,
  validDeliveryData,
  updateDeliveryData,
  inValidDeliveryData
} = require('../../mock-data/delivery-mock-data');
const emailService = require('../../../app/services/messaging/email-service');

const request = supertest(app);

describe('Test delivery endpoints', function() {
  this.timeout(5000);
  let userData;
  let companyData;

  before(() => {
    sinon.stub(emailService, 'sendVerificationMail');
    return request
      .post('/api/v1/auth/register')
      .send(companyUserData)
      .set('Accept', 'application/json')
      .expect(200)
      .then(res => {
        userData = _.get(res, 'body.body.user');
        // Allows middleware to always succeed
        sinon.stub(jwt, 'verify').callsArgWith(2, null, userData);
        return request.post('/api/v1/user/company')
          .send(validCompanyData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200);
      })
      .then(res => {
        companyData = _.get(res, 'body.body.company');
      });
  });

  after(() => {
    sinon.restore();
    let deliveryId;
    knex(DELIVERY_TABLE)
      .orderBy('createdAt', 'desc')
      .first()
      .select('*')
      .then(delivery => {
        deliveryId = delivery.deliveryId;
      });

    // delete newly created user
    return knex(USER_TABLE).where('userId', userData.userId).delete()
      .then(() => knex(USER_EMAIL_TABLE).where('userId', userData.userId).delete())
      .then(() => knex(USER_PHONE_TABLE).where('userId', userData.userId).delete())
      .then(() => knex(USER_PROFILE_TABLE).where('userId', userData.userId).delete())
      .then(() => knex(USER_COMPANY_TABLE).where('userId', userData.userId).delete())
      .then(() => knex(COMPANY_ADDRESS_TABLE).where('companyId', companyData.companyId).delete())
      .then(() => knex(COMPANY_PROFILE_TABLE).where('companyId', companyData.companyId).delete())
      .then(() => knex(DELIVERY_TABLE).delete())
      .then(() => knex(USER_DELIVERY_TABLE).where({
        deliveryId
      }).delete());
  });

  it('creates delivery when info is correct', () => {
    return request
      .post('/api/v1/user/company/delivery')
      .send(validDeliveryData)
      .set('Accept', 'application/json')
      .set('Authorization', 'auth')
      .expect(200)
      .then(res => {
        const data = res.body;
        expect(data).to.be.an('object');
        expect(data).to.have.property('status', 200);
        expect(data).to.have.property('error', false);
        expect(data).to.have.property('message', 'Delivery added successfully');
        expect(data).to.have.property('body');
        expect(data.body).to.have.property('delivery');
        const {
          delivery
        } = data.body;
        expect(delivery).to.be.an('object');
        expect(delivery).to.have.property('details');
        expect(delivery).to.have.property('companyId');
        return delivery.companyId;
      });
  });

  it('updates delivery when info is correct', () => {
    return knex(DELIVERY_TABLE)
      .orderBy('createdAt', 'desc')
      .first()
      .then(delivery => {
        updateDeliveryData.deliveryId = delivery.deliveryId;
        return request
          .put('/api/v1/user/company/delivery')
          .send(updateDeliveryData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('message', 'Delivery updated successfully');
            return data;
          });
      });
  });

  it('can add user to delivery', () => {
    return knex(DELIVERY_TABLE)
      .orderBy('createdAt', 'desc')
      .first()
      .then(delivery => {
        const addData = {
          deliveryId: delivery.deliveryId,
          userId: 999
        };
        return request
          .put('/api/v1/user/company/add-to-delivery')
          .send(addData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('message', 'User added to delivery');
            return data;
          });
      });
  });

  it('can remove user from delivery', () => {
    return knex(DELIVERY_TABLE)
      .orderBy('createdAt', 'desc')
      .first()
      .then(delivery => {
        const addData = {
          deliveryId: delivery.deliveryId,
          userId: 999
        };
        return request
          .post('/api/v1/user/company/remove-from-delivery')
          .send(addData)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('message', 'User removed from delivery');
            return data;
          });
      });
  });

  it('can get all deliveries of logged in company user', () => {

    return request
      .get('/api/v1/user/company/deliveries')
      .set('Accept', 'application/json')
      .set('Authorization', 'auth')
      .expect(200)
      .then(res => {
        const data = res.body;
        expect(data).to.be.an('object');
        expect(data).to.have.property('status', 200);
        expect(data).to.have.property('error', false);
        expect(data).to.have.property('message', 'Deliveries retrieved successfully');
        expect(data.body).to.be.an('array');
        return data;
      });
  });

  it('can get a single delivery by id', () => {
    return knex(DELIVERY_TABLE)
      .orderBy('createdAt', 'desc')
      .first()
      .then(delivery => {
        return request
          .get(`/api/v1/user/delivery/${delivery.deliveryId}`)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
          .expect(200)
          .then(res => {
            const data = res.body;
            expect(data).to.be.an('object');
            expect(data).to.have.property('status', 200);
            expect(data).to.have.property('error', false);
            expect(data).to.have.property('message', 'Delivery retrieved successfully');
            expect(data.body).to.be.an('object');
            expect(data.body).to.have.property('deliveryId');
            return data;
          });
      });
  });

  describe('Failure Tests', () => {
    it('Fails to add new delivery when delivery data is invalid', done => {
      request
        .post('/api/v1/user/company/delivery')
        .send(inValidDeliveryData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .then(res => {
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('message', 'Validation Error: child \"users\" fails because [\"users\" is required]');
          done();
        });
    });
  });
});
