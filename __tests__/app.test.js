const request = require('supertest');
const app = require('../app');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const testData = require('../db/data/test-data/index');
const apiDesc = require('../endpoints');

beforeEach(() => {
	return seed(testData);
});

afterAll(() => {
	return db.end();
});

/**
 * J.D: Please see TODO on line 76 for an explaination behind comments & messy code (TLDR: I was told to PR ASAP).
 */

/**
 * TODO: move to appropraite utils file
 * ReGex explained: we're looking to match an endpoint such that
 * 1. the endpoint must begin with /api
 * 2. /api may be followed by a slash, if (and only if) that slash is followed by another string
 * 3. strings following /api/* may be hyphenated OR may represent parametric endpoints (preceed with a :)
 * 4. endpoints (for the purposes of being included within documentation) must not end with a trailing slash
 * @param {string} route to test, ensuring it is of proper form (/api/*)
 * @returns {boolean} the result of the tested RegEx
 */
function endpointIsValid(route) {
    // note: this regex took quite a while to write!
    // I'm going to need to unit test this seperately... We already have db utils, it doesn't live in there...
    // It feels more like a test util, will need to consider file structure.
    // In addition: this needs to be unit tested prior to being used in integration tests.
    const regex = /^\/api(?:\/(?:[\w-]+(?<=\w)|:[\w-]+(?<=\w)))*(?!\/)$/g;
    return regex.test(route);
}

// Should I be extending jest to add a custom matcher?
// It feels appropriate, but it likely shouldn't live in this file.
// It's a fine line between abstraction hell and properly seperating concerns.
// Hmm, should the jest matcher really be coupled to a utils function?
expect.extend({
    toBeValidEndpoint(apiEndpoint) {
        const pass = endpointIsValid(apiEndpoint);
        return {
            message: () => {
                return `expected ${apiEndpoint} to be of correct form`;
            },
            pass,
        };
    }
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
     * TODO: finish implementing a custom jest matcher for syntactically validating endpoints provided by /api
     * Currently this is a bit of botched job, as I have been spending too long on task 3 (I was advised to continue)
     * Apologies for the messy code (it will be cleaned up in my own time).
     */
    
    test('GET /api should respond with a body containing appropriate api endpoints', () => {
        return request(app)
        .get('/api')
        .expect(200)
        .then((response) => {
            const endpoints = response.body.api;
            // key example: "GET /api/example"
            for (const key in endpoints) {
                const [ requestType, endpointURI ] = key.split(" ");
                expect(endpointURI).toBeValidEndpoint();
            }
            // TODO: migrate logic to unit tests to validate before use in integration tests
            // Valid Endpoints:
            expect('/api').toBeValidEndpoint();
            expect('/api/articles/:article_id').toBeValidEndpoint();
            expect('/api/test/:multiple/parametric/:endpoints').toBeValidEndpoint();
            expect('/api/endpoint/with-hyphens-within/the-endpoint').toBeValidEndpoint();
            // Invalid Endpoints:
            expect('/api/has/a/trailing/slash/').not.toBeValidEndpoint();
            expect('/api/has/a/trailing/hyphen-').not.toBeValidEndpoint();
            expect('/this/does/not/start/with/slash/api').not.toBeValidEndpoint();
            // To see test fail:
            // expect('/api/this/test/should/fail').not.toBeValidEndpoint();
        });
    });

    // TODO: additional integration tests go here

});

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

});

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