'use strict';

// Unit test the auth process
const _ = require('lodash');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const { validUserData, locationServiceMock } = require('../../mock-data/user-mock-data');
const { userAddressesData } = require('../../mock-data/search-mock-data');
const { transporter } = require('../../../app/services/messaging/email-service');
const { googleMapsClient } = require('../../../app/services/location/location-service');

const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE,
  USER_ADDRESS_TABLE
} = require('../../../constants/table.constants');

const request = supertest(app);

describe('test user process end-to-end', function() {
  this.timeout(5000);
  // Ensure db is running and migrations are complete
  let userData;

  before(() => {
    sinon.stub(transporter, 'sendMail').resolves(true);
    sinon.stub(googleMapsClient, 'geocode').returns(locationServiceMock);

    return request
      .post('/api/v1/auth/register')
      .send(validUserData)
      .set('Accept', 'application/json')
      .expect(200)
      .then(res => {
        userData = _.get(res, 'body.body.user');
        // Allows middleware to always succeed
        sinon.stub(jwt, 'verify').callsArgWith(2, null, userData);

        const userAddressesMap = userAddressesData.map(userAddress => {
          return {
            userId: userData.userId,
            ...userAddress
          };
        });

        return knex(USER_ADDRESS_TABLE)
          .insert(userAddressesMap)
          .then(() => knex(USER_EMAIL_TABLE)
            .where({ userId: userData.userId, primary: 1 })
            .update({ isVerified: true })
            .then(() => knex(USER_PHONE_TABLE)
              .where({ userId: userData.userId, primary: 1 })
              .update({ isVerified: true })));
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

  describe('Search tests', () => {
    it('/api/v1/user - returns 10 users if address is within 50 radius', done => {
      request
        .get(`/api/v1/search?address=${userAddressesData[0].street}&radius=50`)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);

          const { users } = data.body;
          expect(users).to.be.an('array');
          expect(users.length).to.equals(10);
          expect(users[0]).to.have.property('userAddressId');
          expect(users[0]).to.have.property('userId');
          expect(users[0]).to.have.property('street');
          expect(users[0]).to.have.property('city');
          expect(users[0]).to.have.property('zip');
          expect(users[0]).to.have.property('latitude');
          expect(users[0]).to.have.property('longitude');
          return done();
        });
    });

    it('/api/v1/user - returns 5 users if zip code is within 30 radius', done => {
      request
        .get(`/api/v1/search?address=${userAddressesData[0].street}`)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);

          const { users } = data.body;
          expect(users).to.be.an('array');
          expect(users.length).to.equals(6);
          expect(users[0]).to.have.property('userAddressId');
          expect(users[0]).to.have.property('userId');
          expect(users[0]).to.have.property('street');
          expect(users[0]).to.have.property('city');
          expect(users[0]).to.have.property('zip');
          expect(users[0]).to.have.property('latitude');
          expect(users[0]).to.have.property('longitude');
          return done();
        });
    });

    it('/api/v1/user - returns 5 users if zip code is within 10 radius', done => {
      request
        .get(`/api/v1/search?address=${userAddressesData[0].zip}&radius=10`)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);

          const { users } = data.body;
          expect(users).to.be.an('array');
          expect(users.length).to.equals(2);
          expect(users[0]).to.have.property('userAddressId');
          expect(users[0]).to.have.property('userId');
          expect(users[0]).to.have.property('street');
          expect(users[0]).to.have.property('city');
          expect(users[0]).to.have.property('zip');
          expect(users[0]).to.have.property('latitude');
          expect(users[0]).to.have.property('longitude');
          return done();
        });
    });

    it('/api/v1/user - returns empty if zip code is not within 0 radius', done => {
      request
        .get(`/api/v1/search?address=${userAddressesData[0].zip}&radius=0`)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);

          const { users } = data.body;
          expect(users).to.be.an('array');
          expect(users).to.be.empty;
          return done();
        });
    });

    it('/api/v1/user - returns error if address is missing', done => {
      request
        .get('/api/v1/search?radius=-1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('message');
          expect(data).to.have.property('status', 422);

          return done();
        });
    });
  });
});
