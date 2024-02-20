const { selectArticle } = require("../models/articles.model");
const { selectCommentsByArticleId } = require("../models/comments.model");

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
    }).catch(next);
};