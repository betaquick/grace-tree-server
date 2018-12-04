'use strict';

// Unit test the auth process
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const mockDb = require('mock-knex');
const mTracker = mockDb.getTracker();
const expect = require('chai').expect;
const supertest = require('supertest');

const app = require('../../../app/config/app-config')();
const { userData, lessPrivilegedUserData }
  = require('../../mock-data/user-mock-data');
const { validClientData, invalidClientData, validUpdateClientData }
  = require('../../mock-data/client-mock-data');
const knex = require('knex')(require('../../../db/knexfile').development);

const request = supertest(app);

describe('test client process end-to-end', () => {
  // Ensure db is running and migrations are complete
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, userData);
  });

  after(() => {
    sandbox.restore();
  });

  describe('Client details endpoints', () => {
    it('GET /api/v1/clients - returns the authenticated user\'s clients', done => {
      request
        .get('/api/v1/clients')
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
          expect(data.body.clients[0]).to.be.an('object');
          expect(data.body.clients[0]).to.have.property('practiceId').to.be.a('number');
          expect(data.body.clients[0]).to.have.property('first_name');
          expect(data.body.clients[0]).to.have.property('last_name');
          return done();
        });
    });

    it('GET /api/v1/client/:id - returns the specified client', done => {
      request
        .get('/api/v1/client/1')
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
          expect(data.body.client).to.be.an('object');
          expect(data.body.client).to.have.property('practiceId').to.be.a('number');
          expect(data.body.client).to.have.property('first_name');
          expect(data.body.client).to.have.property('last_name');
          return done();
        });
    });

    it('GET /api/v1/client/:id - returns error on invalid client', done => {
      request
        .get('/api/v1/client/-1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(404)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 404);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });

    it('POST /api/v1/client - failure on client creation with invalid fields', done => {
      request
        .post('/api/v1/client')
        .send(invalidClientData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data).to.have.property('error', true);
          return done();
        });
    });

    it('POST /api/v1/client - success on client creation with valid fields', done => {
      request
        .post('/api/v1/client')
        .send(validClientData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data).to.have.property('error', false);
          expect(data.body.client).to.be.an('object');
          expect(data.body.client).to.have.property('practiceId').to.be.a('number');
          expect(data.body.client).to.have.property('first_name');
          expect(data.body.client).to.have.property('last_name');
          return done();
        });
    });

    it('PUT /api/v1/client - failure on client update with invalid fields', done => {
      request
        .put('/api/v1/client/1')
        .send(invalidClientData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data).to.have.property('error', true);
          return done();
        });
    });

    it('PUT /api/v1/client - success on client update with valid fields', done => {
      request
        .put('/api/v1/client/1')
        .send(validUpdateClientData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data).to.have.property('error', false);
          expect(data.body.client).to.be.an('object');
          expect(data.body.client).to.have.property('practiceId').to.be.a('number');
          expect(data.body.client).to.have.property('first_name');
          expect(data.body.client).to.have.property('last_name');
          return done();
        });
    });

  });

  describe('Failure tests', () => {
    beforeEach(() => {
      // mock db
      mockDb.mock(knex);
      mTracker.install();
      mTracker.on('query', query => query.reject(new Error()));
    });

    afterEach(() => {
      mTracker.uninstall();
      mockDb.unmock(knex);
    });

    it('GET /api/v1/clients - returns 500 on query error', () => {
      return request
        .get('/api/v1/clients')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('GET /api/v1/client - returns 500 on query error', () => {
      return request
        .get('/api/v1/client/1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('POST /api/v1/client - returns 500 on query error', () => {
      return request
        .post('/api/v1/client')
        .send(validClientData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('PUT /api/v1/client - returns 500 on query error', () => {
      return request
        .put('/api/v1/client/1')
        .send(validUpdateClientData)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(500)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });
  });
});


describe('Test with a different role', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, lessPrivilegedUserData);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('GET /api/v1/clients - returns 200 if user is not an admin', () => {
    return request
      .get('/api/v1/clients')
      .set('Accept', 'application/json')
      .set('Authorization', 'auth')
      .expect(200)
      .then(res => {
        const { body: data } = res;
        expect(data).to.be.an('object');
        expect(data).to.have.property('error', false);
        expect(data).to.have.property('status', 200);
        expect(data).to.have.property('message').to.be.a('string');
      });
  });
});
