const { selectArticle, selectArticles, updateArticleVotes } = require('../models/articles.model');

exports.getArticle = (request, response, next) => {
    const articleId = request.params.article_id;
    return selectArticle(articleId)
    .then((result) => {
        response.status(200).send({ article: result });
    })
    .catch(next);
};

exports.getArticles = (request, response, next) => {
    return selectArticles()
    .then((result) => {
        response.status(200).send({ articles: result });
    })
    .catch(next);
};

exports.patchArticleVotes = (request, response, next) => {
    const articleId = request.params.article_id;
    const voteCount = request.body.inc_votes;
    return selectArticle(articleId)
    .then((result) => {
        return updateArticleVotes(articleId, voteCount);
    })
    .then((result) => {
        response.status(200).send({ article: result });
    })
    .catch(next);
};