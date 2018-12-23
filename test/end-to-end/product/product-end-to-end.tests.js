'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const mockDb = require('mock-knex');
const mTracker = mockDb.getTracker();

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);

const request = supertest(app);

describe('/api/v1/product endpoints', () => {
  it('/api/v1/products - returns a list of users', done => {
    request
      .get('/api/v1/products')
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        expect(err).to.a.null;
        const { body: data } = res;
        expect(data).to.be.an('object');
        expect(data).to.have.property('error', false);
        expect(data).to.have.property('status', 200);
        expect(data).to.have.property('message').to.be.a('string');
        expect(data.body.products).to.be.an('array');
        expect(data.body.products[0]).to.have.property('productId').to.be.a('number');
        expect(data.body.products[0]).to.have.property('productCode');
        expect(data.body.products[0]).to.have.property('productDesc');
        expect(data.body.products[0]).to.have.property('active');
        return done();
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

    it('/api/v1/products - returns a 500 error for listing products', done => {
      request
        .get('/api/v1/products')
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
