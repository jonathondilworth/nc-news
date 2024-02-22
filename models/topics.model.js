const db = require('../db/connection');

exports.selectTopics = () => {
    return db.query(`
        SELECT * FROM topics
    `)
    .then(({ rows }) => {
        return rows;
    });
};

exports.selectTopic = (slug) => {
    return db.query(`
        SELECT * FROM topics
        WHERE slug = $1
    `, [slug])
    .then(({ rows }) => {
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : rows[0];
    });
};