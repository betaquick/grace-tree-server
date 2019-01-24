'use strict';

// Unit test the auth process
const _ = require('lodash');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { UserTypes } = require('@betaquick/grace-tree-constants');

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const {
  validUserData
} = require('../../mock-data/user-mock-data');
const emailService = require('../../../app/services/messaging/email-service');

const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE,
  NOTIFICATION_TABLE
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

        return knex(NOTIFICATION_TABLE)
          .insert({ sender: userData.userId, recipient: userData.userId, message: 'Hello' })
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
      .then(() => knex(NOTIFICATION_TABLE).where('sender', userData.userId).delete());
  });

  describe('Notifications test', () => {
    it('/api/v1/notifications - returns success if notifications exist', done => {
      request
        .get('/api/v1/notifications')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);

          const { notifications } = data.body;
          expect(notifications).to.be.an('array');
          expect(notifications[0]).to.have.property('notificationId');
          expect(notifications[0]).to.have.property('sender');
          expect(notifications[0]).to.have.property('recipient');
          expect(notifications[0]).to.have.property('message');
          expect(notifications[0]).to.have.property('read');
          return done();
        });
    });
  });

  describe('Notification tests', () => {
    let notificationId = null;
    before(() => {
      return knex(NOTIFICATION_TABLE)
        .where({ sender: userData.userId })
        .first()
        .then(notification => {
          notificationId = notification.notificationId;
          return notification;
        });
    });

    it('/api/v1/notification - returns success if notification exists', done => {
      request
        .get(`/api/v1/notifications/${notificationId}`)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);

          const { notification } = data.body;
          expect(notification).to.be.an('object');
          expect(notification).to.have.property('notificationId');
          expect(notification).to.have.property('sender');
          expect(notification).to.have.property('recipient');
          expect(notification).to.have.property('message');
          expect(notification).to.have.property('read');
          return done();
        });
    });

    it('/api/v1/notification - returns success if notification doesn\'t exist', done => {
      request
        .get('/api/v1/notifications/-1')
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

  describe('Notifications tests for Admin', () => {
    before(() => {
      return knex(USER_TABLE)
        .where({ userId: userData.userId })
        .update({ userType: UserTypes.TreeAdmin });
    });

    after(() => {
      return knex(USER_TABLE)
        .where({ userId: userData.userId })
        .update({ userType: UserTypes.General });
    });

    it('/api/v1/notifications - returns success if notifications exist', done => {
      request
        .get('/api/v1/notifications')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const data = res.body;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);

          const { notifications } = data.body;
          expect(notifications).to.be.an('array');
          expect(notifications[0]).to.have.property('notificationId');
          expect(notifications[0]).to.have.property('sender');
          expect(notifications[0]).to.have.property('recipient');
          expect(notifications[0]).to.have.property('message');
          expect(notifications[0]).to.have.property('read');
          return done();
        });
    });
  });
});
