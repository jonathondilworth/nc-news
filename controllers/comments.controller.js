const { selectArticle, checkArticleExists } = require("../models/articles.model");
const { selectCommentsByArticleId, insertComment, deleteCommentById, updateCommentVotes } = require("../models/comments.model");
const { selectUserByUsername } = require("../models/users.model");

exports.getCommentsByArticleId = (request, response, next) => {
    const articleId = request.params.article_id;
    const promises = [
        selectArticle(articleId),
        selectCommentsByArticleId(articleId)
    ];
    return Promise.all(promises).then((resolved) => {
        const [ articleResult, commentsResult ] = resolved;
        response.status(200).send({ comments: commentsResult });
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
    .then((result) => {
        return checkArticleExists(articleId);
    })
    .then((result) => {
        return insertComment(articleId, username, body);
    })
    .then((result) => {
        response.status(201).send({ comment: result });
    })
    .catch(next);
}

exports.deleteComment = (request, response, next) => {
    const commentId = request.params.comment_id;
    return deleteCommentById(commentId)
    .then((result) => {
        response.status(204).send();
    })
    .catch(next);
};

/**
 * TODO: refactor all controller methods to destructure parameters from request (query || params)
 */

exports.patchCommentVotes = (request, response, next) => {
    const { comment_id } = request.params;
    const voteCount = request.body.inc_votes ?? 0;
    return updateCommentVotes(comment_id, voteCount)
    .then((result) => {
        response.status(200).send({ comment: result });
    })
    .catch(next);
};