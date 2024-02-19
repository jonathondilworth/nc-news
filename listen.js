const app = require('app');

app.listen(9090, (err) => {
	if (err) console.log('An error has occured: cannot start server.');
	else console.log('Server is listening on port 9090...');
});