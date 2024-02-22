const db = require("../db/connection");

/**
 * TODO: consider potential refactor, selectUsers could accept parameters and
 * manually build the query, as to not have both functions: selectUsers & selectUserByUsername
 */

exports.selectUsers = () => {
    return db.query(`
        SELECT * FROM users
    `)
    .then(({ rows }) => {
        return rows;
    });
};

exports.selectUserByUsername = (username) => {
    return db.query(`
        SELECT * FROM users
        WHERE username = $1
    `, [username])
    .then(({ rows }) => {
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : rows[0];
    });
};