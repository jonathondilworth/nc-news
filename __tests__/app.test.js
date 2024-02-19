const request = require('supertest');
const app = require('../app');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const testData = require('../db/data/test-data/index');
const apiDesc = require('../endpoints');
const { toBeValidAPIEndpoint, toBeValidRequestMethod } = require('./helpers/custom');

beforeEach(() => {
	return seed(testData);
});

afterAll(() => {
	return db.end();
});

/**
 * Register Custom Matchers
 */
expect.extend({
    toBeValidAPIEndpoint,
    toBeValidRequestMethod
});

describe('API', () => {

    test('GET /api should respond with a 200 status code & a body containing an api property', () => {
        return request(app)
        .get('/api')
        .expect(200)
        .then((response) => {
            expect(response.body).toHaveProperty('api');
        });
    });

    test('GET /api response should equal the object stored within our projects endpoints.json file', () => {
        return request(app)
        .get('/api')
        .expect(200)
        .then((response) => {
            expect(response.body.api).toEqual(apiDesc);
        });
    });

    /**
     * Although these tests are not required, I felt as though there should be a standard that endpoints.js
     * follows; and at minimum it should include a valid method, a valid endpoint and a description.
     * These tests would ensure that any typos that invalidate that standard are caught before hitting prod.
     */
    describe('Syntactically validate endpoints.json by virtue of analysing the response from /api', () => {

        /**
         * Uses custom matchers, see ./helpers/custom.js
         */
        test('GET /api should respond with a body containing appropriate api endpoints', () => {
            return request(app)
            .get('/api')
            .expect(200)
            .then((response) => {
                const endpoints = response.body.api;
                expect(Object.entries(endpoints).length).toBeGreaterThan(0);
                // endpointDesc example: "GET /api/example"
                for (const endpointDesc in endpoints) {
                    const [ requestType, endpointPath ] = endpointDesc.split(" ");
                    expect(requestType).toBeValidRequestMethod();
                    expect(endpointPath).toBeValidAPIEndpoint();
                }
            });
        });

        /**
         * J.D: This is a bit wordy & possibly hard to follow, TODO: consider potential refactors.
         */
        test('GET /api should respond with api endpoints that contain, at minimum, a description', () => {
            return request(app)
            .get('/api')
            .expect(200)
            .then((response) => {
                const iterableEndpoints = Object.entries(response.body.api);
                expect(iterableEndpoints.length).toBeGreaterThan(0);
                iterableEndpoints.forEach(([endpointKey, endpointValue]) => {
                    expect(endpointValue).toMatchObject({
                        description: expect.any(String)
                    });
                }); // foreach
            }); // response
        }); // test
        
    }); // describe: Syntactically validate endpoints.json

}); // describe: API

describe('Topics', () => {
    
    test('GET /api/topics should respond with a 200 status code', () => {
        return request(app)
        .get('/api/topics')
        .expect(200);
    });
    
    test('GET /api/topics response should contain an array of topics', () => {
        return request(app)
        .get('/api/topics')
        .expect(200)
        .then((response) => {
            expect(response.body).toHaveProperty('topics');
            expect(response.body.topics).toBeInstanceOf(Array);
        });
    });

    test('GET /api/topics response should be the correct length (same as topicData length)', () => {
        return request(app)
        .get('/api/topics')
        .expect(200)
        .then((response) => {
            const topics = response.body.topics;
            expect(topics).toHaveLength(testData.topicData.length);
        });
    });

    test('GET /api/topics topics should have properties: description & slug', () => {
        return request(app)
        .get('/api/topics')
        .expect(200)
        .then((response) => {
            const topics = response.body.topics;
            topics.forEach((topic) => {
                expect(topic).toMatchObject({
                    description: expect.any(String),
                    slug: expect.any(String)
                });
            }); // foreach
        }); // response
    }); // test

}); // Describe: Topics

describe('Generic Error Handling', () => {

    describe('Request to /api/this-is-not-an-endpoint should respond with a 404 and a msg body of: not found, regardless of method', () => {
        
        const methods = ['get', 'post', 'patch', 'put', 'delete'];
        const endpoint = '/api/this-is-not-an-endpoint';

        methods.forEach((method) => {
            test(`${method.toUpperCase()} ${endpoint}`, () => {
                return request(app)
                [method](endpoint)
                .expect(404)
                .then((response) => {
                    expect(response.body).toHaveProperty('msg');
                    expect(response.body.msg).toBe('not found');
                });
            });
        });

    }); // Describe: request /api/is-not-an-endpoint

}); // Describe: Generic Error Handling