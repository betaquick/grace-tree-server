'use strict';

// Unit test the auth process
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const _ = require('lodash');

const {VerificationTypes} = require('@betaquick/grace-tree-constants');

const { transporter } = require('../../../app/services/messaging/email-service');
const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const { validUserData, invalidUserData } = require('../../mock-data/user-mock-data');
const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE
} = require('../../../constants/table.constants');

const request = supertest(app);

describe('test auth process end-to-end', function() {
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
      .then(() => knex(USER_PROFILE_TABLE).where('userId', userData.userId).delete());
  });

  describe('/api/v1/auth', () => {
    it('/api/v1/auth/register - valid register successful', () => {
      expect(userData).to.have.property('firstName');
      expect(userData).to.have.property('lastName');
      expect(userData).to.have.property('userId');
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
          expect(body).to.have.property('message').to.match(/Email address has already been taken/);
          expect(body).to.have.property('status', 422);
          return done();
        });
    });

    it('/api/v1/auth/register - failure on invalid data', done => {
      // make email valid
      const mockUserData = _.cloneDeep(invalidUserData);
      _.set(mockUserData, 'emails[0].emailAddress', validUserData.emails[0].emailAddress);

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
          expect(body).to.have.property('message').to.match(/Validation Error: child "firstName" fails because \["firstName" is required\]/);
          expect(body).to.have.property('status', 422);
          return done();
        });
    });

    it('/api/v1/auth/verify - verify email generated successfully', () => {
      return knex(USER_EMAIL_TABLE)
        .first()
        .where('userId', userData.userId)
        .then(email => {
          expect(email).to.have.property('userId', userData.userId);
          expect(email).to.have.property('emailAddress', validUserData.emails[0].emailAddress);
          expect(email).to.have.property('primary', 1);
          expect(email).to.have.property('verificationCode').that.is.a('string');
          expect(email).to.have.property('verificationCodeExpiry').that.is.a('date');
          expect(email).to.have.property('isVerified', 0);
        });
    });

    it('/api/v1/auth/verify - verify phone generated successfully', () => {
      return knex(USER_PHONE_TABLE)
        .first()
        .where('userId', userData.userId)
        .then(phone => {
          expect(phone).to.have.property('userId', userData.userId);
          expect(phone).to.have.property('phoneNumber', validUserData.phones[0].phoneNumber);
          expect(phone).to.have.property('primary', 1);
          expect(phone).to.have.property('verificationCode').that.is.a('string');
          expect(phone).to.have.property('verificationCodeExpiry').that.is.a('date');
          expect(phone).to.have.property('isVerified', 0);
        });
    });

    describe('Validate Email and SMS Tests', () => {
      let emailVerificationCode;
      let phoneVerificationCode;

      beforeEach(() => {
        return knex(USER_EMAIL_TABLE)
          .first()
          .where({
            userId: userData.userId,
            emailAddress: validUserData.emails[0].emailAddress
          })
          /* eslint-disable-next-line no-return-assign */
          .then(fetchedEmail => emailVerificationCode = fetchedEmail.verificationCode)
          .then(() => {
            return knex(USER_PHONE_TABLE)
              .first()
              .where({
                userId: userData.userId,
                phoneNumber: validUserData.phones[0].phoneNumber
              });
          })
          /* eslint-disable-next-line no-return-assign */
          .then(fetchedPhone => phoneVerificationCode = fetchedPhone.verificationCode);
      });

      afterEach(() => {
        // remove verification
        return knex(USER_EMAIL_TABLE)
          .update({isVerified: 0})
          .where({
            userId: userData.userId,
            emailAddress: validUserData.emails[0].emailAddress
          })
          .then(() => {
            return knex(USER_PHONE_TABLE)
              .update({isVerified: 0})
              .where({
                userId: userData.userId,
                phoneNumber: validUserData.phones[0].phoneNumber
              });
          });
      });

      it('/api/v1/auth/validate - validate email token successfully', () => {
        return request
          .put(`/api/v1/auth/validate/${VerificationTypes.Email}/${emailVerificationCode}`)
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
            expect(user).to.have.property('email').to.be.an('object');
            expect(user.email).to.have.property('userId').to.be.a('number');
            expect(user.email).to.have.property('emailAddress').to.be.a('string');
            expect(user.email).to.have.property('primary').to.be.a('number');
            expect(user.email).to.have.property('isVerified').to.be.a('number');

            expect(user).to.have.property('phone').to.be.an('object');
            expect(user.phone).to.have.property('userId').to.be.a('number');
            expect(user.phone).to.have.property('phoneNumber').to.be.a('string');
            expect(user.phone).to.have.property('primary').to.be.a('number');
            expect(user.phone).to.have.property('isVerified').to.be.a('number');
          });
      });

      it('/api/v1/auth/validate - validate email token failed', done => {
        request.put(`/api/v1/auth/validate/${VerificationTypes.Email}/invalid`)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
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

      it('/api/v1/auth/validate - validate email token failed if token expired', () => {
        return knex(USER_EMAIL_TABLE)
          .where({
            userId: userData.userId,
            emailAddress: validUserData.emails[0].emailAddress
          })
          .update({
            verificationCodeExpiry: moment().subtract(1, 'h').format('YYYY-MM-DD HH:mm:ss')
          })
          .then(() => {
            return request
              .put(`/api/v1/auth/validate/${VerificationTypes.Email}/${emailVerificationCode}`)
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
          })
          .then(() => {
            // reset expiration
            return knex(USER_EMAIL_TABLE)
              .where({
                userId: userData.userId,
                emailAddress: validUserData.emails[0].emailAddress
              })
              .update({
                verificationCodeExpiry: moment().add(1, 'd').format('YYYY-MM-DD HH:mm:ss')
              });
          });
      });

      it('/api/v1/auth/validate - validate sms token successful', () => {
        return request
          .put(`/api/v1/auth/validate/${VerificationTypes.SMS}/${phoneVerificationCode}`)
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
            expect(user).to.have.property('email').to.be.an('object');
            expect(user.email).to.have.property('userId').to.be.a('number');
            expect(user.email).to.have.property('emailAddress').to.be.a('string');
            expect(user.email).to.have.property('primary').to.be.a('number');
            expect(user.email).to.have.property('isVerified').to.be.a('number');

            expect(user).to.have.property('phone').to.be.an('object');
            expect(user.phone).to.have.property('userId').to.be.a('number');
            expect(user.phone).to.have.property('phoneNumber').to.be.a('string');
            expect(user.phone).to.have.property('primary').to.be.a('number');
            expect(user.phone).to.have.property('isVerified').to.be.a('number');
          });
      });

      it('/api/v1/auth/validate - validate sms token failed', done => {
        request
          .put(`/api/v1/auth/validate/${VerificationTypes.SMS}/invalid`)
          .set('Accept', 'application/json')
          .set('Authorization', 'auth')
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
            expect(body).to.have.property('message');
            expect(body).to.have.property('status', 422);
            return done();
          });
      });

      it('/api/v1/auth/validate - validate sms token expired', () => {
        return knex(USER_PHONE_TABLE)
          .where({
            userId: userData.userId,
            phoneNumber: validUserData.phones[0].phoneNumber
          })
          .update({
            verificationCodeExpiry: moment().subtract(1, 'h').format('YYYY-MM-DD HH:mm:ss')
          })
          .then(() => {
            return request
              .put(`/api/v1/auth/validate/${VerificationTypes.SMS}/${phoneVerificationCode}`)
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
          })
          .then(() => {
            // reset expiration
            return knex(USER_PHONE_TABLE)
              .where({
                userId: userData.userId,
                phoneNumber: validUserData.phones[0].phoneNumber
              })
              .update({
                verificationCodeExpiry: moment().add(1, 'd').format('YYYY-MM-DD HH:mm:ss')
              });
          });
      });
    });

    describe('Login tests', () => {
      it('/api/v1/auth/login - login succeeds', done => {
        request
          .post('/api/v1/auth/login')
          .send({
            email: validUserData.emails[0].emailAddress,
            password: validUserData.password
          })
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', false);
            expect(body).to.have.property('message', 'Login successful');
            expect(body).to.have.property('status', 200);
            const {body: {user}} = body;
            expect(user).to.have.property('userId', userData.userId);
            expect(user).to.have.property('firstName', userData.firstName);
            expect(user).to.have.property('lastName', userData.lastName);
            return done();
          });
      });

      it('/api/v1/auth/login - login fails bad credentials', done => {
        request
          .post('/api/v1/auth/login')
          .send({
            email: validUserData.emails[0].emailAddress,
            password: '#123456'
          })
          .set('Accept', 'application/json')
          .expect(422)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', true);
            expect(body).to.have.property('message', 'System Error: Incorrect login credentials');
            expect(body).to.have.property('status', 422);
            return done();
          });
      });

      it('/api/v1/auth/login - login fails bad email', done => {
        request
          .post('/api/v1/auth/login')
          .send({
            email: 'invalid@hmail.com',
            password: '#123456'
          })
          .set('Accept', 'application/json')
          .expect(422)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', true);
            expect(body).to.have.property('message', 'System Error: Incorrect user credentials');
            expect(body).to.have.property('status', 422);
            return done();
          });
      });

      describe('Login fails when user is inactive', () => {
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

        it('/api/v1/auth/login - failure if account is disabled', done => {
          request
            .post('/api/v1/auth/login')
            .send({
              email: validUserData.emails[0].emailAddress,
              password: validUserData.password
            })
            .set('Accept', 'application/json')
            .expect(422)
            .end((err, res) => {
              expect(err).to.a.null;
              const { body } = res;
              expect(body).to.be.an('object');
              expect(body).to.have.property('error', true);
              expect(body).to.have.property('message', 'System Error: User\'s account has been disabled.');
              expect(body).to.have.property('status', 422);
              return done();
            });
        });
      });
    });

    describe('Forgot Password tests', () => {
      it('/api/v1/auth/forgot-password - valid email successful', done => {
        request
          .post('/api/v1/auth/forgot-password')
          .send({
            email: validUserData.emails[0].emailAddress
          })
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', false);
            expect(body).to.have.property(
              'message',
              `An e-mail has been sent to ${validUserData.emails[0].emailAddress} with further instructions.`
            );
            expect(body).to.have.property('status', 200);
            return done();
          });
      });

      it('/api/v1/auth/forgot-password - failure if email not found', done => {
        request
          .post('/api/v1/auth/forgot-password')
          .send({
            email: 'invalid@hmail.com'
          })
          .set('Accept', 'application/json')
          .expect(422)
          .end((err, res) => {
            expect(err).to.a.null;
            const { body } = res;
            expect(body).to.be.an('object');
            expect(body).to.have.property('error', true);
            expect(body).to.have.property('message', 'System Error: Email address doesn\'t exist');
            expect(body).to.have.property('status', 422);
            return done();
          });
      });

      describe('Forgot Password tests', () => {
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

        it('/api/v1/auth/forgot-password - failure if account is disabled', done => {
          request
            .post('/api/v1/auth/forgot-password')
            .send({
              email: validUserData.emails[0].emailAddress
            })
            .set('Accept', 'application/json')
            .expect(422)
            .end((err, res) => {
              expect(err).to.a.null;
              const { body } = res;
              expect(body).to.be.an('object');
              expect(body).to.have.property('error', true);
              expect(body).to.have.property('message', 'System Error: User\'s account has been disabled.');
              expect(body).to.have.property('status', 422);
              return done();
            });
        });
      });

      describe('Reset Password tests', () => {
        let token = null;
        before(() => {
          return knex(USER_TABLE)
            .where({ userId: userData.userId })
            .first()
            .then(user => {
              token = user.resetPasswordToken;
              return user;
            });
        });

        it('/api/v1/auth/reset/:token - valid token returns user object', done => {
          request
            .get(`/api/v1/auth/reset/${token}`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, res) => {
              expect(err).to.a.null;
              const { body: data } = res;
              expect(data).to.be.an('object');
              expect(data).to.have.property('error', false);
              expect(data).to.have.property('status', 200);
              expect(data).to.have.property('message').to.be.a('string');
              expect(data.body.user).to.have.property('userId').to.be.a('number');
              expect(data.body.user).to.have.property('email');
              expect(data.body.user).to.have.property('firstName');
              expect(data.body.user).to.have.property('lastName');
              return done();
            });
        });

        it('/api/v1/auth/reset/:token - returns 422 if token is invalid', () => {
          return request
            .get('/api/v1/auth/reset/invalid_token')
            .set('Accept', 'application/json')
            .expect(422)
            .then(res => {
              const { body } = res;
              expect(body).to.be.an('object');
              expect(body).to.have.property('error', true);
              expect(body).to.have.property('message');
              expect(body).to.have.property('status', 422);
            });
        });

        it('/api/v1/auth/reset-password - reset password successful', () => {
          const params = {
            token,
            password: validUserData.password,
            confirmPassword: validUserData.confirmPassword
          };
          return request
            .post('/api/v1/auth/reset-password')
            .send(params)
            .set('Accept', 'application/json')
            .expect(200)
            .then(res => {
              const { body } = res;
              expect(body).to.be.an('object');
              expect(body).to.have.property('error', false);
              expect(body).to.have.property('message');
              expect(body).to.have.property('status', 200);
            });
        });

        it('/api/v1/auth/reset-password - Returns 422 if passwords don\'t match', done => {
          const params = {
            token,
            password: validUserData.password,
            confirmPassword: 'mismatch'
          };
          request
            .post('/api/v1/auth/reset-password')
            .send(params)
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

        describe('Reset Password fails if token is expired', () => {
          before(() => {
            return knex(USER_TABLE)
              .where({ userId: userData.userId })
              .update({
                resetPasswordToken: token,
                resetPasswordExpiry: moment().subtract(1, 'h').format('YYYY-MM-DD HH:mm:ss')
              });
          });

          after(() => {
            return knex(USER_TABLE)
              .where({ userId: userData.userId })
              .update({
                resetPasswordToken: null,
                resetPasswordExpiry: null
              });
          });

          it('/api/v1/auth/reset/:token - returns 422 if token is expired', () => {
            return request
              .get(`/api/v1/auth/reset/${token}`)
              .set('Accept', 'application/json')
              .expect(422)
              .then(res => {
                const { body } = res;
                expect(body).to.be.an('object');
                expect(body).to.have.property('error', true);
                expect(body).to.have.property('message');
                expect(body).to.have.property('status', 422);
              });
          });

          it('/api/v1/auth/reset-password - returns 422 if token is expired', done => {
            const params = {
              token,
              password: validUserData.password,
              confirmPassword: validUserData.confirmPassword
            };
            request
              .post('/api/v1/auth/reset-password')
              .send(params)
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
        });
      });
    });
  });
});
