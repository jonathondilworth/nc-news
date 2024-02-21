const { selectArticle } = require("../models/articles.model");
const { selectCommentsByArticleId, insertComment } = require("../models/comments.model");

exports.getCommentsByArticleId = (request, response, next) => {
    const articleId = request.params.article_id;
    const promises = [
        selectArticle(articleId),
        selectCommentsByArticleId(articleId)
    ];
    return Promise.all(promises).then((resolved) => {
        const [ articleResult, commentsResult ] = resolved;
        if (articleResult.rowCount === 0) {
            return Promise.reject({ status: 404, msg: 'not found' });
        }
        // if the article exists with no comments, returns []
        response.status(200).send({ comments: commentsResult.rows });
    })
    .catch(next);
};

exports.postComment = (request, response, next) => {
    const articleId = request.params.article_id;
    const requestBody = request.body;
    return selectArticle(articleId)
    .then(({ rows }) => {
        return (rows.length === 0)
            ? Promise.reject({ status: 404, msg: 'not found' })
            : insertComment(articleId, requestBody.username, requestBody.body);
    })
    .then(({ rows }) => {
        response.status(201).send({ comment: rows[0] });
    })
    .catch(next);
}