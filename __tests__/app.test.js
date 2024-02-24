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

        describe('Queries / Query String', () => {
            
            test('should ignore any query params that are not valid & should return articles normally', () => {
                return request(app)
                .get(`/api/articles?notvalid=cats`)
                .expect(200)
                .then((response) => {
                    const articles = response.body.articles;
                    expect(articles).toHaveLength(13);
                });
            });

            describe('topic', () => {
                
                test('should accept a query string containing topic & returns (200) filtered results by topic', () => {
                    return request(app)
                    .get(`/api/articles?topic=cats`)
                    .expect(200)
                    .then((response) => {
                        const articles = response.body.articles;
                        // J.D: there is only one article with topic cats within test data
                        expect(articles).toHaveLength(1);
                        expect(articles[0]).toHaveProperty('article_id', 5);
                    });
                });
        
                test('should respond with 200 & empty array if topic exists but there are no rows', () => {
                    return request(app)
                    .get(`/api/articles?topic=paper`)
                    .expect(200)
                    .then((response) => {
                        const articles = response.body.articles;
                        expect(articles).toHaveLength(0);
                    });
                });
        
                test('should respond with 404 not found for topics that do not exist', () => {
                    return request(app)
                    .get(`/api/articles?topic=banana`)
                    .expect(404)
                    .then((response) => {
                        expect(response.body).toHaveProperty('msg');
                        expect(response.body.msg).toBe('not found');
                    });
                });
        
                /**
                 * Successful injection attack would return all rows, an unsuccessful attack should result in a 404
                 */
                test('should protect agaisnt SQL injection attacks', () => {
                    return request(app)
                    .get(`/api/articles?topic=cats'%20OR%201=1;--`) // converted to: cats' OR 1=1;-- by express
                    .expect(404)
                    .then((response) => {
                        expect(response.body).toHaveProperty('msg');
                        expect(response.body.msg).toBe('not found');
                    });
                });

            });

            describe('sort_by & order', () => {

                const validColumns = ['article_id', 'title', 'topic', 'author', 'created_at', 'votes'];

                const validOrders = ['asc', 'desc'];

                describe('should accept a query string parameter of sort_by which sorts by any valid column (DESC)', () => {
                    validColumns.forEach((column) => {
                        test(`should sort articles by ${column} in DESC order`, () => {
                            return request(app)
                            .get(`/api/articles?sort_by=${column}`)
                            .expect(200)
                            .then((response) => {
                                const articles = response.body.articles;
                                expect(articles.map((article) => {
                                    return article[column];
                                })).toBeSorted({
                                    descending: true
                                });
                            });
                        });
                    });
                });
        
                describe('should accept a query of sort_by and order which sorts by a valid column in a valid order', () => {
                    validColumns.forEach((column) => {
                        validOrders.forEach((order) => {
                            test(`should sort articles by ${column} in (explicitly) ${order} order`, () => {
                                return request(app)
                                .get(`/api/articles?sort_by=${column}&order=${order}`)
                                .expect(200)
                                .then((response) => {
                                    const articles = response.body.articles;
                                    expect(articles.map((article) => {
                                        return article[column];
                                    })).toBeSorted({
                                        descending: order === 'desc'
                                    });
                                });
                            });
                        });
                    });
                });

                test('should sort by created_at by default, but in ascending order if order=asc provided', () => {
                    return request(app)
                    .get(`/api/articles?order=asc`)
                    .expect(200)
                    .then((response) => {
                        const articles = response.body.articles;
                        expect(articles.map((article) => {
                            return article.created_at;
                        })).toBeSorted({
                            ascending: true
                        });
                    });
                });

                test('should respond with a 400 if sort_by is set but is not a valid column', () => {
                    return request(app)
                    .get(`/api/articles?sort_by=not-a-valid-column`)
                    .expect(400)
                    .then((response) => {
                        expect(response.body).toHaveProperty('msg');
                        expect(response.body.msg).toBe('bad request');
                    });
                });

                test('should respond with a 400 bad request if order is defined but invalid', () => {
                    return request(app)
                    .get(`/api/articles?order=not-a-valid-order`)
                    .expect(400)
                    .then((response) => {
                        expect(response.body).toHaveProperty('msg');
                        expect(response.body.msg).toBe('bad request');
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
                    article_img_url: expect.any(String),
                    comment_count: expect.any(Number)
                });
            });
        });

        test('should respond with the appropriate number of comments within comment_count', () => {
            // arrange
            const articleId = 9;
            // act
            return request(app)
            .get(`/api/articles/${articleId}`)
            .expect(200)
            .then((response) => {
                // assert
                expect(response.body.article).toHaveProperty('comment_count', 2);
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

        test('should respond /w 200 & unaltered article if inc_votes is not within the payload (ignores extra properties)', () => {
            // arrange
            const articleId = 2;
            const patchBody = {
                some_random_key: 'random data', 
                not_inc_votes: 42
            };
            // act
            return request(app)
            .patch(`/api/articles/${articleId}`)
            .send(patchBody)
            .expect(200)
            .then((response) => {
                // assert
                expect(response.body.article).toHaveProperty('votes', 0);
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

describe('Users', () => {
    
    describe('GET /api/users', () => {
        
        test('should respond with (200) an array of user objects, with the appropriate properties', () => {
            return request(app)
            .get(`/api/users`)
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty('users');
                const users = response.body.users;
                expect(users).toBeInstanceOf(Array);
                // J.D: This test will break if you modify the users test data (add or remove users)
                expect(users).toHaveLength(4);
                users.forEach((user) => {
                    expect(user).toMatchObject({
                        'username': expect.any(String),
                        'name': expect.any(String),
                        'avatar_url': expect.any(String)
                    });
                });
            });
        });

    });

    describe('GET /api/users/:username', () => {
        
        test('should respond with a user object with the appropriate properties', () => {
            return request(app)
            .get(`/api/users/lurker`)
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty('user');
                const user = response.body.user;
                expect(user).toEqual({
                    'username': 'lurker',
                    'name': 'do_nothing',
                    'avatar_url': 'https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png'
                });
            });
        });

        test('should respond with a 404 not found for a user that does not exist in the databse', () => {
            return request(app)
            .get(`/api/users/not-a-user`)
            .expect(404)
            .then((response) => {
                expect(response.body).toHaveProperty('msg');
                expect(response.body.msg).toBe('not found');
            });
        });

    });

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