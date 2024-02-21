const { selectTopics } = require('../models/topics.model');

exports.getTopics = (request, response, next) => {
    return selectTopics()
    .then((result) => {
        response.status(200).send({ topics: result });
    })
    .catch(next);
};