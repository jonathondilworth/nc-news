const express = require('express');
const app = express();
const apiDesc = require('./endpoints');
const { getTopics } = require('./controllers/topics.controller');
const { getArticle } = require('./controllers/articles.controller');

// middleware: (nothing yet registered - besides error handling at bottom of file)

// routes: specification
app.get('/api', (request, response, next) => {
    response.status(200).send({ api: apiDesc });
});

// routes: articles
app.get('/api/articles/:article_id', getArticle);

// routes: topics
app.get('/api/topics', getTopics);

// routes: fallthrough (404)
app.all('/*', (request, response, next) => {
	response.status(404).send({ msg: 'not found' });
});

// register error handling middleware: pSQL errors
app.use((err, request, response, next) => {
	/**
	 * 22P02: invalid text representation
	 * 42601: syntax error
	 * 42703: undefined column or parameter (limit is cast to NaN << throws this code)
	 * 23502: violates not null constraint
	 */
	const badRequestErrCodes = ['22P02', '42601', '42703', '23502'];
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