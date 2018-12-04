'use strict';

// Unit test the auth process
const _ = require('lodash');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const mockDb = require('mock-knex');
const mTracker = mockDb.getTracker();
const expect = require('chai').expect;
const supertest = require('supertest');

const app = require('../../../app/config/app-config')();
const { userData, lessPrivilegedUserData }
  = require('../../mock-data/user-mock-data');
const knex = require('knex')(require('../../../db/knexfile').development);
const { validPhone, invalidPhone, validOffice, invalidOffice, validPractice }
  = require('../../mock-data/practice-mock-data');

const request = supertest(app);

describe('test practice process end-to-end', () => {
  // Ensure db is running and migrations are complete
  // const USER_TABLE = 'user';
  const PRACTICE_TABLE = 'practice';
  const PRACTICE_PHONE_TABLE = 'practice_phone';
  const PRACTICE_OFFICE_TABLE = 'practice_office';
  let sandbox;
  let practice;

  before(() => {
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, userData);
  });

  after(() => {
    sandbox.restore();
  });

  describe('Practice details endpoints', () => {
    it('GET /api/v1/practice - returns the authenticated user\'s practice details', done => {
      request
        .get('/api/v1/practice')
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
          expect(data.body.practice).to.be.an('object');
          expect(data.body.practice).to.have.property('practiceId').to.be.a('number');
          expect(data.body.practice).to.have.property('email');
          expect(data.body.practice).to.have.property('name');
          return done();
        });
    });

    it('GET /api/v1/practice - returns success on get practice', () => {
      return knex(PRACTICE_TABLE)
        .first()
        .select(['name', 'email'])
        .then(fetchedPractice => {
          practice = fetchedPractice;
          return request
            .get('/api/v1/practice')
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(200)
            .then(res => {
              const { body: data } = res;
              expect(data).to.be.an('object');
              expect(data).to.have.property('error', false);
              expect(data).to.have.property('status', 200);
              expect(data).to.have.property('message').to.be.a('string');
              expect(data.body).to.be.an('object');
              expect(data.body.practice).to.have.property('practiceId').to.be.a('number');
              expect(data.body.practice).to.have.property('email');
              expect(data.body.practice).to.have.property('name');
            });
        });
    });

    it('PUT /api/v1/practice - returns a failure on practice update when invalid data is passed', done => {
      const clonedPractice = _.cloneDeep(practice);
      clonedPractice.email = 1;
      request
        .put('/api/v1/practice')
        .send(clonedPractice)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
          return done();
        });
    });

    it('PUT /api/v1/practice - returns a success on practice update', () => {
      return request
        .put('/api/v1/practice')
        .send(validPractice)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.practice).to.have.property('practiceId').to.be.a('number');
          expect(data.body.practice).to.have.property('email');
          expect(data.body.practice).to.have.property('name');
        });
    });

    it('POST /api/v1/practice/phone - returns a failure when adding invalid phone', () => {
      return request
        .post('/api/v1/practice/phone')
        .send(invalidPhone)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(422)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 422);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('POST /api/v1/practice/phone - returns a success when adding valid phone', () => {
      return request
        .post('/api/v1/practice/phone')
        .send(validPhone)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.phone).to.have.property('phoneId').to.be.a('number');
          expect(data.body.phone).to.have.property('phone_no');
          expect(data.body.phone).to.have.property('phone_type');
        });
    });

    it('POST /api/v1/practice/office - returns a failure when adding invalid office', () => {
      return knex(PRACTICE_PHONE_TABLE) // TODO review
        .truncate()
        .then(() => {
          return request
            .post('/api/v1/practice/office')
            .send(invalidOffice)
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(422)
            .then(res => {
              const { body: data } = res;
              expect(data).to.be.an('object');
              expect(data).to.have.property('error', true);
              expect(data).to.have.property('status', 422);
              expect(data).to.have.property('message').to.be.a('string');
            });
        });
    });

    it('POST /api/v1/practice/office - returns a success when adding valid office', () => {
      return knex(PRACTICE_OFFICE_TABLE) // TODO review
        .truncate()
        .then(() => {
          return request.post('/api/v1/practice/office')
            .send(validOffice)
            .set('Accept', 'application/json')
            .set('Authorization', 'auth')
            .expect(200)
            .then(res => {
              const { body: data } = res;
              expect(data).to.be.an('object');
              expect(data).to.have.property('error', false);
              expect(data).to.have.property('status', 200);
              expect(data).to.have.property('message').to.be.a('string');
              expect(data.body.office).to.have.property('officeId').to.be.a('number');
              expect(data.body.office).to.have.property('name');
              expect(data.body.office).to.have.property('street');
              expect(data.body.office).to.have.property('city');
              expect(data.body.office).to.have.property('state');
            });
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

    it('GET /api/v1/practice - returns 500 on query error', () => {
      return request
        .get('/api/v1/practice')
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

    it('PUT /api/v1/practice - returns 500 on update if query error', () => {
      const clonedPractice = _.cloneDeep(practice);
      return request
        .put('/api/v1/practice')
        .send(clonedPractice)
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

    it('POST /api/v1/practice/phone - returns 500 on add phone if query error', () => {
      return request
        .post('/api/v1/practice/phone')
        .send(validPhone)
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

    it('POST /api/v1/practice/office - returns 500 on add office if query error', () => {
      return request
        .post('/api/v1/practice/office')
        .send(validOffice)
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


describe('Failure tests if Role Auth fails', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, lessPrivilegedUserData);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('GET /api/v1/practice - returns 403 if user is not an admin', () => {
    return request
      .get('/api/v1/practice')
      .set('Accept', 'application/json')
      .set('Authorization', 'auth')
      .expect(403)
      .then(res => {
        const { body: data } = res;
        expect(data).to.be.an('object');
        expect(data).to.have.property('error', true);
        expect(data).to.have.property('status', 403);
        expect(data).to.have.property('message').to.be.a('string');
      });
  });
});
