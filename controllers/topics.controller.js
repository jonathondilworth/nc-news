const { selectTopics } = require('../models/topics.model');

exports.getTopics = (request, response, next) => {
    selectTopics()
    .then(({ rows }) => {
        response.status(200).send({ topics: rows });
    })
    .catch(next);
};