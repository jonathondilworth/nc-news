const { selectArticle } = require("../models/articles.model");
const { selectCommentsByArticleId, insertComment, deleteCommentById } = require("../models/comments.model");
const { selectUserByUsername } = require("../models/users.model");

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
    const { username, body } = request.body;

    // J.D: uncertain as to whether this is neccesary
    //      since any datatype will be cast to string
    if (!username || typeof body !== 'string') {
        next({ status: 400, msg: 'bad request'});
    }

    return selectUserByUsername(username)
    .then(({ user }) => {
        return selectArticle(articleId);
    })
    .then(({ rows }) => {
        // J.D: TODO: Migrate logic to the model (similar to the selectUserByUsername)
        // However, there are a lot of similar changes, going to use a seperate branch for this
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : insertComment(articleId, username, body);
    })
    .then(({ rows }) => {
        response.status(201).send({ comment: rows[0] });
    })
    .catch(next);
}

exports.deleteComment = (request, response, next) => {
    const commentId = request.params.comment_id;
    return deleteCommentById(commentId)
    .then(({ rowCount }) => {
        if (rowCount === 0) {
            return Promise.reject({ status: 404, msg: 'not found' });
        }
        response.status(204).send({});
    })
    .catch(next);
};