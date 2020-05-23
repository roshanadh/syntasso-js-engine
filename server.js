const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const router = require('./routes/router.js');

app.set('json spaces', 2);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});
