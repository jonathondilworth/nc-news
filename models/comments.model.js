const db = require('../db/connection');

exports.selectCommentsByArticleId = (id) => {
    return db.query(`
        SELECT * FROM comments
        WHERE article_id = $1
        ORDER BY created_at DESC
    `, [id])
    .then(({ rows }) => {
        // return [] if there are no comments
        return rows;
    });
};

exports.insertComment = (articleId, author, body) => {
    return db.query(`
        INSERT INTO comments
        (author, body, article_id)
        VALUES
        ($1, $2, $3)
        RETURNING *
    `, [author, body, articleId])
    .then(({ rows }) => {
        return rows[0];
    });
};

exports.deleteCommentById = (id) => {
    return db.query(`
        DELETE FROM comments
        WHERE comment_id = $1
        RETURNING *
    `, [id])
    .then(({ rows }) => {
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : rows;
    });
};

exports.updateCommentVotes = (id, voteCount) => {
    return db.query(`
        UPDATE comments
        SET votes = votes + $1
        WHERE comment_id = $2
        RETURNING *
    `, [voteCount, id])
    .then(({ rows }) => {
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : rows[0];
    });
};