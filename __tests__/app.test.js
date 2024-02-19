const request = require('supertest');
const app = require('../app');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const testData = require('../db/data/test-data/index');

beforeEach(() => {
	return seed(testData);
});

afterAll(() => {
	return db.end();
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