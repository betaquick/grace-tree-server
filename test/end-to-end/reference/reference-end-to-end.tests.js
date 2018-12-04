'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const mockDb = require('mock-knex');
const mTracker = mockDb.getTracker();

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);

const request = supertest(app);

describe('test reference process end-to-end', () => {
  describe('/api/v1/reference reference endpoints', () => {
    it('/api/v1/reference/roles - returns list of roles', done => {
      request
        .get('/api/v1/reference/roles')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.roles).to.be.an('array');
          expect(data.body.roles[0]).to.have.property('roleId').to.be.a('number');
          expect(data.body.roles[0]).to.have.property('role_name');
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

    it('/api/v1/reference/roles - returns a 500 error for listing roles', done => {
      request
        .get('/api/v1/reference/roles')
        .set('Accept', 'application/json')
        .expect(500)
        .end((err, res) => {
          expect(err).to.a.null;
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 500);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });
  });
});
