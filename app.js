const express = require('express');

const app = express();

const { getTopics } = require('./controllers/topics.controller');

// middleware: (nothing yet registered)

// routes: topics
app.get('/api/topics', getTopics);

// routes: fallthrough (404)
app.all('/*', (request, response, next) => {
	response.status(404).send({ msg: 'not found' });
});

// error handling

// fallthrough exceptions (catch-all): 500
app.use((err, request, response, next) => {
	response.status(500).send({ msg: 'Internal Server Error' });
});

module.exports = app;