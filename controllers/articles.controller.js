const { selectArticle, selectArticles, updateArticleVotes } = require('../models/articles.model');

exports.getArticle = (request, response, next) => {
    const articleId = request.params.article_id;
    return selectArticle(articleId)
    .then(({ rows }) => {
        if (rows.length === 0) {
            return Promise.reject({ status: 404, msg: 'not found' });
        }
        response.status(200).send({ article: rows[0] });
    })
    .catch(next);
};

exports.getArticles = (request, response, next) => {
    return selectArticles()
    .then(({ rows }) => {
        response.status(200).send({ articles: rows });
    })
    .catch(next);
};

exports.patchArticleVotes = (request, response, next) => {
    const articleId = request.params.article_id;
    const voteCount = request.body.inc_votes;
    return selectArticle(articleId)
    .then(({ rows }) => {
        return (rows.length === 0)
            ? Promise.reject({ status: 404, msg: 'not found' })
            : updateArticleVotes(articleId, voteCount);
    })
    .then(({ rows }) => {
        response.status(200).send({ article: rows[0] });
    })
    .catch(next);
};