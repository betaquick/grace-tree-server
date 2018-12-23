'use strict';

const expect = require('chai').expect;
const { production, development } = require('../../db/knexfile');
const knexFile = require('../../db/knexfile');
const SITE = process.env.SITE;

describe('test knexfile initializes with proper env', () => {
  describe('verify development env', () => {
    before(() => {
      process.env.SITE = 'development';
    });

    after(() => {
      process.env.SITE = SITE;
    });
    it('valid development environment', done => {
      expect(knexFile.getKnexInstance()).to.deep.equal(development);
      done();
    });
  });

  describe('verify production env', () => {
    before(() => {
      process.env.SITE = 'production';
    });

    after(() => {
      process.env.SITE = SITE;
    });
    it('valid production environment', done => {
      expect(knexFile.getKnexInstance()).to.deep.equal(production);
      done();
    });
  });
});
