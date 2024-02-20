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
    
    test('GET /api/topics response should have a status code of 200 & contain an array of topics', () => {
        return request(app)
        .get('/api/topics')
        .expect(200)
        .then((response) => {
            expect(response.body).toHaveProperty('topics');
            expect(response.body.topics).toBeInstanceOf(Array);
        });
    });

    test('GET /api/topics topics should have properties: description & slug & a correct length', () => {
        return request(app)
        .get('/api/topics')
        .expect(200)
        .then((response) => {
            const topics = response.body.topics;
            // J.D: Please be aware that if you modify the test data, this test may fail
            expect(testData.topicData.length).toBe(3);
            expect(topics).toHaveLength(3);
            topics.forEach((topic) => {
                expect(topic).toMatchObject({
                    description: expect.any(String),
                    slug: expect.any(String)
                });
            }); // foreach
        }); // response
    }); // test

}); // Describe: Topics

describe('Articles', () => {
    
    describe('GET /api/articles', () => {
        
        test('should respond with a 200 status & an array of articles', () => {
            return request(app)
            .get(`/api/articles`)
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty('articles');
                expect(response.body.articles).toBeInstanceOf(Array);
            });
        });

        test('should respond array of articles (of correct length) with appropriate properties', () => {
            return request(app)
            .get(`/api/articles`)
            .expect(200)
            .then((response) => {
                const articles = response.body.articles;
                // J.D: Please be aware that if you modify the test data, this test may fail
                expect(testData.articleData).toHaveLength(13);
                expect(articles).toHaveLength(13);
                articles.forEach((article) => {
                    expect(article).toMatchObject({
                        article_id: expect.any(Number),
                        author: expect.any(String),
                        title: expect.any(String),
                        topic: expect.any(String),
                        body: expect.any(String),
                        created_at: expect.any(String),
                        votes: expect.any(Number),
                        article_img_url: expect.any(String),
                        comment_count: expect.any(String)
                    });
                });
            });
        });

    }); // Describe: GET /api/articles

    describe('GET /api/articles/:article_id', () => {
        
        test('should respond with a 200 status, article object & appropriate properties when provided a valid id', () => {
            // arrange
            const articleId = 1;
            // act
            return request(app)
            .get(`/api/articles/${articleId}`)
            .expect(200)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('article');
                expect(response.body.article).toMatchObject({
                    article_id: expect.any(Number),
                    title: expect.any(String),
                    topic: expect.any(String),
                    author: expect.any(String),
                    body: expect.any(String),
                    created_at: expect.any(String),
                    votes: expect.any(Number),
                    /**
                     * TODO: could extend custom matcher: toBeValid<Request|APIEndpoint|...> to accept URL
                     * + others & use to validate article_img_url, amongst other things.
                     */
                    article_img_url: expect.any(String)
                });
            });
        });

        test('should respond with a 404 not found if the id is valid but does not exist', () => {
            // arrange
            const outOfBoundsArticleId = testData.articleData.length + 999;
            // act
            return request(app)
            .get(`/api/articles/${outOfBoundsArticleId}`)
            .expect(404)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('not found');
            });
        });

        test('should respond with a 400 bad request if the id is invalid (e.g: is of the wrong type)', () => {
            // arrange
            const invalidArticleId = 'not-a-valid-article-id';
            // act
            return request(app)
            .get(`/api/articles/${invalidArticleId}`)
            .expect(400)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

    }); // Describe: GET /api/article/:article_id

}); // Describe: Articles

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