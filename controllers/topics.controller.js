const { selectTopics } = require('../models/topics.model');

exports.getTopics = (request, response, next) => {
    return selectTopics()
    .then(({ rows }) => {
        response.status(200).send({ topics: rows });
    })
    .catch(next);
};