'use strict';

// Unit test the template process
const _ = require('lodash');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const mockDb = require('mock-knex');
const mTracker = mockDb.getTracker();

const app = require('../../../app/config/app-config')();
const knex = require('knex')(require('../../../db/knexfile').development);
const { userData } = require('../../mock-data/user-mock-data');
const { templateData, invalidTemplateData } = require('../../mock-data/template-mock-data');

const request = supertest(app);

describe('test users process end-to-end', () => {
  // Ensure db is running and migrations are complete
  const TEMPLATE_TABLE = 'template';

  let sandbox;
  let template;

  before(() => {
    sandbox = sinon.createSandbox();
    // Allows middle to always succeed
    sandbox.stub(jwt, 'verify').callsArgWith(2, null, userData);
  });

  after(() => {
    sandbox.restore();
  });

  describe('/api/v1/templates templates endpoints', () => {
    it('/api/v1/templates - returns a list of template types', done => {
      request
        .get('/api/v1/templates/types')
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
          expect(data.body.templateTypes).to.be.an('array');
          expect(data.body.templateTypes[0]).to.have.property('template_typeId').to.be.a('number');
          expect(data.body.templateTypes[0]).to.have.property('type_name');
          return done();
        });
    });

    it('/api/v1/templates - returns a list of templates', done => {
      request
        .get('/api/v1/templates')
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
          expect(data.body.templates).to.be.an('array');
          expect(data.body.templates[0]).to.have.property('templateId').to.be.a('number');
          expect(data.body.templates[0]).to.have.property('template_typeId').to.be.a('number');
          expect(data.body.templates[0]).to.have.property('template_name');
          expect(data.body.templates[0]).to.have.property('is_active');
          return done();
        });
    });

    it('/api/v1/templates - returns success on get template', () => {
      return knex(TEMPLATE_TABLE)
        .first()
        .select(['templateId', 'template_typeId', 'template_name'])
        .then(fetchedTemplate => {
          template = fetchedTemplate;
          return request
            .get(`/api/v1/templates/${template.templateId}`)
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
              expect(data.body.template).to.have.property('templateId').to.be.a('number');
              expect(data.body.template).to.have.property('template_typeId').to.be.a('number');
              expect(data.body.template).to.have.property('template_name');
              expect(data.body.template).to.have.property('is_active');
            });
        });
    });

    it('/api/v1/templates - returns 404 on get template if id is not found', () => {
      return request
        .get('/api/v1/templates/-1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(404)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 404);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/templates - failure on templates creation with invalid fields', done => {
      request
        .post('/api/v1/templates')
        .send(invalidTemplateData)
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

    it('/api/v1/templates - success on templates creation with valid fields', () => {
      return request
        .post('/api/v1/templates')
        .send(templateData)
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
          expect(data.body.templateId[0]).to.be.a('number');
          return data.body.templateId[0];
        })
        .then(templateId => {
          // delete newly created template
          const template = knex(TEMPLATE_TABLE).where({ templateId }).delete();
          const question = knex('template_question').where({ templateId }).delete();
          const activity = knex('activity').where({ userId: userData.userId }).delete();
          return Promise.all([template, question, activity]);
        });
    });

    it('/api/v1/templates - returns a failure on templates update when invalid data is passed', () => {
      const clonedTemplate = _.cloneDeep(template);
      return request
        .put('/api/v1/templates/' + clonedTemplate.templateId)
        .send(clonedTemplate)
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

    it('/api/v1/templates - returns a success on templates update', () => {
      const clonedTemplate = _.cloneDeep(template);
      clonedTemplate.questions = templateData.questions;
      return request
        .put('/api/v1/templates/' + clonedTemplate.templateId)
        .send(clonedTemplate)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(200)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', false);
          expect(data).to.have.property('status', 200);
          expect(data).to.have.property('message').to.be.a('string');
          expect(data.body.template).to.have.property('templateId').to.be.a('number');
          expect(data.body.template).to.have.property('template_typeId').to.be.a('number');
          expect(data.body.template).to.have.property('template_name');
          expect(data.body.template).to.have.property('is_active');
        });
    });

    it('/api/v1/templates - returns 404 error on template update for id not found', () => {
      const clonedTemplate = _.cloneDeep(template);
      clonedTemplate.questions = templateData.questions;
      // make data with negative Id
      return request
        .put('/api/v1/templates/-1')
        .send(clonedTemplate)
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
        .expect(404)
        .then(res => {
          const { body: data } = res;
          expect(data).to.be.an('object');
          expect(data).to.have.property('error', true);
          expect(data).to.have.property('status', 404);
          expect(data).to.have.property('message').to.be.a('string');
        });
    });

    it('/api/v1/templates - returns success on delete template', () => {
      // make data with negative Id
      return request
        .delete('/api/v1/templates/-1')
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

    it('/api/v1/templates - returns 422 error on delete template if id is invalid', () => {
      // make data with negative Id
      return request
        .delete('/api/v1/templates/invalid')
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

    it('/api/v1/templates - returns a 500 error for listing template types', done => {
      request
        .get('/api/v1/templates/types')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
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

    it('/api/v1/templates - returns a 500 error for listing templates', done => {
      request
        .get('/api/v1/templates')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
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

    it('/api/v1/templates - returns a 500 error for deleting template', done => {
      request
        .delete('/api/v1/templates/-1')
        .set('Accept', 'application/json')
        .set('Authorization', 'auth')
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
