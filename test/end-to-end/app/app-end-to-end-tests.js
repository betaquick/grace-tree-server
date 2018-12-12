'use strict';
const { handleError } = require('./../../../app/controllers/util/controller-util');
const error = require('debug')('application:auth-controller:error');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const router = require('../../../app/config/routes');

// Error Route
router.get('/error-route', (req, res, next) => {
  next(new Error());
});

const app = require('../../../app/config/app-config')();
const { userData } = require('../../mock-data/user-mock-data');

const request = supertest(app);
const invalid_route = -1;

describe('test routing process end-to-end', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    // Allows auth middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, userData);
  });

  after(() => {
    sandbox.restore();
  });

  describe('/api/v1/', () => {
    it('/api/v1/ - route not found', done => {
      request
        .get('/api/v1/' + invalid_route)
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('status', 404);
          expect(body).to.have.property(
            'message',
            'error 404 - Route not found'
          );
          return done();
        });
    });

    it('/api/v1/ - home route', done => {
      request
        .get('/api/v1/')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('title', 'Application API');
          return done();
        });
    });

    it('/api/v1/ - app error handler', done => {
      request
        .get('/api/v1/error-route')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('status', 500);
          expect(body).to.have.property(
            'message',
            'Error in application, passed down to error handler'
          );
          return done();
        });
    });

    it('/api/v1/ - validation error handler', done => {
      router.get('/422', (req, res, next) => {
        const err = {
          name: 'ValidationError',
          message: 'Validation error'
        };
        return handleError(err, res, 'System Error', error);
      });

      request
        .get('/api/v1/422')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('status', 422);
          return done();
        });
    });

    it('/api/v1/ - system error handler', done => {
      router.get('/500', (req, res, next) => {
        return handleError({}, res, 'System Error', error);
      });

      request
        .get('/api/v1/500')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('status', 500);
          return done();
        });
    });

    it('/api/v1/ - system error handler', done => {
      router.get('/400', (req, res, next) => {
        return handleError({ code: 400 }, res, 'System Error', error);
      });

      request
        .get('/api/v1/400')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(400)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body } = res;
          expect(body).to.be.an('object');
          expect(body).to.have.property('error', true);
          expect(body).to.have.property('status', 400);
          return done();
        });
    });
  });
});
