const express = require('express');
const app = express();
const apiDesc = require('./endpoints');
const { getTopics } = require('./controllers/topics.controller');
const { getArticle, getArticles, patchArticleVotes } = require('./controllers/articles.controller');
const { getCommentsByArticleId, postComment, deleteComment, patchCommentVotes } = require('./controllers/comments.controller');
const { getUsers, getUser } = require('./controllers/users.controller');
const cors = require('cors');

// middleware
app.use(cors());
app.use(express.json());

// routes: specification
app.get('/api', (request, response, next) => {
    response.status(200).send({ api: apiDesc });
});

// routes: articles
app.get('/api/articles', getArticles);
app.get('/api/articles/:article_id', getArticle);
app.patch('/api/articles/:article_id', patchArticleVotes);

// routes: comments
app.get('/api/articles/:article_id/comments', getCommentsByArticleId);
app.post('/api/articles/:article_id/comments', postComment);
app.delete('/api/comments/:comment_id', deleteComment);
app.patch('/api/comments/:comment_id', patchCommentVotes);

// routes: topics
app.get('/api/topics', getTopics);

// routes: users
app.get('/api/users', getUsers);
app.get('/api/users/:username', getUser);

// routes: fallthrough (404)
app.all('/*', (request, response, next) => {
	response.status(404).send({ msg: 'not found' });
});

/**
 * TODO: refactor error handling into its own controller
 */

// register error handling middleware: pSQL errors
app.use((err, request, response, next) => {
	/**
	 * Note (From Feedback): currently only require 22P02, add other codes in as they become required
	 * 22P02: invalid text representation
	 * 42601: syntax error
	 * 42703: undefined column or parameter (limit is cast to NaN << throws this code)
	 * 23502: violates not null constraint
	 * 23503: foreign key constraint violation
	 */
	const badRequestErrCodes = ['22P02', '23502', '23503', '42601'];
	if (badRequestErrCodes.includes(err.code)) {
		response.status(400).send({ msg: 'bad request' });
	}
	next(err);
});

// promise rejections & generic errors
app.use((err, request, response, next) => {
	if (err.status && err.msg) {
		response.status(err.status).send({ msg: err.msg })
	}
	next(err);
});

// fallthrough exceptions (catch-all): 500
app.use((err, request, response, next) => {
	response.status(500).send({ msg: 'Internal Server Error' });
});

module.exports = app;
