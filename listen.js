const app = require('./app.js');

const { PORT = 9090 } = process.env;

app.listen(PORT, (err) => {
	if (err) console.log(`An error has occured: cannot start server.`);
	else console.log(`Server is listening on port ${PORT}...`);
});