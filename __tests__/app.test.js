const request = require('supertest');
const app = require('../app');
const db = require('../db/connection');
const seed = require('../db/seeds/seed');
const testData = require('../db/data/test-data/index');
const apiDesc = require('../endpoints');
const { toBeValidAPIEndpoint, toBeValidRequestMethod } = require('./helpers/custom');
const { selectCommentsByArticleId } = require('../models/comments.model');

require('jest-sorted')

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
                        created_at: expect.any(String),
                        votes: expect.any(Number),
                        article_img_url: expect.any(String),
                        comment_count: expect.any(Number)
                    });
                    // the response should not contain a body
                    expect(article).not.toMatchObject({
                        body: expect.any(String)
                    });
                });
            });
        });

        test('should respond with an array of articles in descending order (ordered by date)', () => {
            return request(app)
            .get(`/api/articles`)
            .expect(200)
            .then((response) => {
                const articles = response.body.articles;
                expect(articles.map((article) => {
                    return article.created_at;
                })).toBeSorted({
					descending: true
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

    describe('PATCH /api/articles/:article_id', () => {
        
        test('should accept a body of form { inc_votes: x }, updates correct article by x votes & responds /w updated obj', () => {
            // arrange
            const articleId = 2;
            const patchBody = { inc_votes: 42 };
            // act
            return request(app)
            .patch(`/api/articles/${articleId}`)
            .send(patchBody)
            .expect(200)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('article');
                expect(response.body.article).toHaveProperty('votes', 42);
                expect(response.body.article).toMatchObject({
                    article_id: expect.any(Number),
                    title: expect.any(String),
                    topic: expect.any(String),
                    author: expect.any(String),
                    body: expect.any(String),
                    created_at: expect.any(String),
                    votes: expect.any(Number),
                    article_img_url: expect.any(String)
                });
            });
        });

        test('should also function as expected with negative numbers (decrement the vote count)', () => {
            // arrange
            const articleId = 2;
            const patchBody = { inc_votes: -42 };
            // act
            return request(app)
            .patch(`/api/articles/${articleId}`)
            .send(patchBody)
            .expect(200)
            .then((response) => {
                // assert
                expect(response.body.article).toHaveProperty('votes', -42);
            });
        });

        test('should respond with a 404 not found if the article id is valid, but does not exist', () => {
            // arrange
            const articleId = 999;
            const patchBody = { inc_votes: 42 };
            // act
            return request(app)
            .patch(`/api/articles/${articleId}`)
            .send(patchBody)
            .expect(404)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('not found');
            });
        });

        test('should respond with a 400 bad request if the article id is invalid', () => {
            // arrange
            const articleId = "this-is-not-an-article-id";
            const patchBody = { inc_votes: 42 };
            // act
            return request(app)
            .patch(`/api/articles/${articleId}`)
            .send(patchBody)
            .expect(400)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

        test('should respond with a 400 bad request if the payload value is invalid', () => {
            // arrange
            const articleId = 2;
            const patchBody = { inc_votes: 'not-a-number' };
            // act
            return request(app)
            .patch(`/api/articles/${articleId}`)
            .send(patchBody)
            .expect(400)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

        test('should respond with a 400 bad request if the payload key is invalid', () => {
            // arrange
            const articleId = 2;
            const patchBody = { invalid_key: 42 };
            // act
            return request(app)
            .patch(`/api/articles/${articleId}`)
            .send(patchBody)
            .expect(400)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

    });

}); // Describe: Articles

describe('Comments', () => {
    
    describe('GET /api/articles/:article_id/comments', () => {
        
        test('should respond with an array of comments', () => {
            // arrange
            const articleId = 1;
            // act
            return request(app)
            .get(`/api/articles/${articleId}/comments`)
            .expect(200)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('comments');
                expect(response.body.comments).toBeInstanceOf(Array);
            });
        });

        test('should respond with an array of comments of correct length and with correct attributes', () => {
            // arrange
            const articleId = 1;
            // act
            return request(app)
            .get(`/api/articles/${articleId}/comments`)
            .expect(200)
            .then((response) => {
                // assert
                const comments = response.body.comments;
                // J.D: modifications of test data (comments) may break this test
                //      please be cautious adding or removing test comments
                expect(comments).toHaveLength(11);
                comments.forEach((comment) => {
                    expect(comment).toMatchObject({
                        comment_id: expect.any(Number),
                        votes: expect.any(Number),
                        created_at: expect.any(String),
                        author: expect.any(String),
                        body: expect.any(String),
                        article_id: expect.any(Number)
                    });
                });
            });
        });

        test('should respond with most recent comments first', () => {
            // arrange
            const articleId = 1;
            // act
            return request(app)
            .get(`/api/articles/${articleId}/comments`)
            .expect(200)
            .then((response) => {
                // assert
                const comments = response.body.comments;
                expect(comments).toHaveLength(11);
                expect(comments.map((comment) => {
                    return comment.created_at;
                })).toBeSorted({
                    descending: true
                });
            });
        });

        test('should respond a 404 not found if the article id does not exist', () => {
            // arrange
            const articleId = 999;
            // act
            return request(app)
            .get(`/api/articles/${articleId}/comments`)
            .expect(404)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('not found');
            });
        });

        test('should respond a 400 bad request if the article id is invalid', () => {
            // arrange
            const articleId = "this-is-an-invalid-article-id";
            // act
            return request(app)
            .get(`/api/articles/${articleId}/comments`)
            .expect(400)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

        test('should respond an empty array if the article id is valid but there are no comments', () => {
            // arrange
            const articleId = 4;
            // act
            return request(app)
            .get(`/api/articles/${articleId}/comments`)
            .expect(200)
            .then((response) => {
                // assert
                const comments = response.body.comments;
                expect(comments).toHaveLength(0);
            });
        });

    }); // Describe: GET /api/articles/:article_id/comments

    describe('POST /api/articles/:article_id/comments', () => {
        
        test('should respond with a 201 status and the new comment obj persisted to the db', () => {
            const articleId = 9;
            const commentBody = {
				username: 'rogersop',
                body: 'How Lovely!'
			};
			return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(201)
			.then((response) => {
                expect(response.body).toHaveProperty('comment');
				const comment = response.body.comment;
                expect(comment).toHaveProperty('body', 'How Lovely!');
                expect(comment).toHaveProperty('author', 'rogersop');
                expect(comment).toHaveProperty('article_id', 9);
                expect(comment).toHaveProperty('votes', 0);
                expect(comment).toMatchObject({
                    comment_id: expect.any(Number),
                    created_at: expect.any(String),
                });
			});
        });

        test('should respond with a 201 status if the body contains username & body + additional key-value pairs (ignores them)', () => {
            const articleId = 9;
            const commentBody = {
				username: 'rogersop',
                body: 'How Lovely!',
                this: 'is',
                another: 'ignorable',
                param: '!'
			};
			return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(201)
			.then((response) => {
                expect(response.body).toHaveProperty('comment');
				const comment = response.body.comment;
                expect(comment).toHaveProperty('body', 'How Lovely!');
                expect(comment).toHaveProperty('author', 'rogersop');
                expect(comment).toHaveProperty('article_id', 9);
                expect(comment).toHaveProperty('votes', 0);
                expect(comment).toMatchObject({
                    comment_id: expect.any(Number),
                    created_at: expect.any(String),
                });
			});
        });

        test('should respond with a 404 status if the article id is valid but does not exist', () => {
            const articleId = 999;
            const commentBody = {
				username: 'rogersop',
                body: 'How might I try and break this API?'
            };
            return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('not found');
            });
        });

        test('should respond with a 400 status (bad request) if the article id is invalid', () => {
            const articleId = 'this-is-not-a-valid-api-endpoint';
            const commentBody = {
				username: 'rogersop',
                body: 'How might I try and break this API?'
            };
            return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

        test('should respond with a 404 status (not found) if the user does not exist', () => {
            const articleId = 9;
            const commentBody = {
				username: 'injecting-a-fake-user',
                body: 'How might I try and break this API?'
            };
            return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('not found');
            });
        });

        test('should respond with a 400 status (bad request) if the comment payload is invalid (body is not a string)', () => {
            const articleId = 9;
            const commentBody = {
				username: 'rogersop',
                body: { "invalid": "type" }
            };
            return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

        test('should respond with a 400 status (bad request) if the comment payload does not contain a username', () => {
            const articleId = 9;
            const commentBody = {
                body: 'How might I try and break this API?'
            };
            return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

        test('should respond with a 400 status (bad request) if the comment payload does not contain a body', () => {
            const articleId = 9;
            const commentBody = {
                username: 'rogersop'
            };
            return request(app)
			.post(`/api/articles/${articleId}/comments`)
			.send(commentBody)
			.expect(400)
            .then((response) => {
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

    }); // Describe: POST /api/articles/:article_id/comments

    describe('DELETE /api/comments/:comment_id', () => {
        
        test('should delete a comment via comment_id and respond with a 204', () => {
            // arrange
            // comment 16 belongs to article_id 6 and is the only comment on that article
            const commentId = 16;
            // act
            return request(app)
            .delete(`/api/comments/${commentId}`)
            .expect(204)
            .then(() => {
                // there should now be a total of zero comments on article 6
                return selectCommentsByArticleId(6);
            })
            .then((result) => {
                expect(result).toHaveLength(0);
            });
        });

        test('should respond with a 404 status if the comment id is valid but does not exist', () => {
            // arrange
            const commentId = 999;
            // act
            return request(app)
			.delete(`/api/comments/${commentId}`)
			.expect(404)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('not found');
            });
        });

        test('should respond with a 400 bad request if the comment id is invalid', () => {
            // arrange
            const commentId = 'this-is-not-a-comment-id';
            // act
            return request(app)
			.delete(`/api/comments/${commentId}`)
			.expect(400)
            .then((response) => {
                // assert
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('bad request');
            });
        });

    }); // Describe: DELETE /api/comments/:comment_id

}); // Describe: Comments


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