const db = require('../db/connection');

exports.selectCommentsByArticleId = (id) => {
    return db.query(`
        SELECT * FROM comments
        WHERE article_id = $1
        ORDER BY created_at DESC
    `, [id]);
};

exports.insertComment = (articleId, author, body) => {
    return db.query(`
        INSERT INTO comments
        (author, body, article_id)
        VALUES
        ($1, $2, $3)
        RETURNING *
    `, [author, body, articleId]);
};

exports.deleteCommentById = (id) => {
    return db.query(`
        DELETE FROM comments
        WHERE comment_id = $1
    `, [id]);
};