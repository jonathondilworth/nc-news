const db = require("../db/connection");

exports.selectUserByUsername = (username) => {
    return db.query(`
        SELECT * FROM users
        WHERE username = $1
    `, [username])
    .then(({ rows }) => {
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : { user: rows[0] };
    });
};