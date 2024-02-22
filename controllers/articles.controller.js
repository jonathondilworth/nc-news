const { selectArticle, selectArticles, updateArticleVotes } = require('../models/articles.model');
const { selectTopic } = require('../models/topics.model');

exports.getArticle = (request, response, next) => {
    const articleId = request.params.article_id;
    return selectArticle(articleId)
    .then((result) => {
        response.status(200).send({ article: result });
    })
    .catch(next);
};

exports.getArticles = (request, response, next) => {
    const { topic, sort_by, order } = request.query;
    return Promise.all([
        selectArticles(topic, sort_by, order),
        topic ? selectTopic(topic) : undefined
    ])
    .then((resolved) => {
        const [ articleResults, topicResults ] = resolved;
        response.status(200).send({ articles: articleResults });
    })
    .catch(next);
};

exports.patchArticleVotes = (request, response, next) => {
    const articleId = request.params.article_id;
    const voteCount = request.body.inc_votes ?? 0;
    return selectArticle(articleId)
    .then((result) => {
        return updateArticleVotes(articleId, voteCount);
    })
    .then((result) => {
        response.status(200).send({ article: result });
    })
    .catch(next);
};