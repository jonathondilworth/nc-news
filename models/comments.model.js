const db = require('../db/connection');

exports.selectCommentsByArticleId = (id) => {
    return db.query(`
        SELECT * FROM comments
        WHERE article_id = $1
        ORDER BY created_at DESC
    `, [id]);
};