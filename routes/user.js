const express = require('express');
const router = express.Router();
const postgres = require('postgres');
PGHOST='ep-super-shadow-47901102.us-east-2.aws.neon.tech'
PGDATABASE='FinalProject'
PGUSER='nuranabipour'
PGPASSWORD='OlFpt25LeZDM'
ENDPOINT_ID='ep-super-shadow-47901102'

const sql = postgres({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: 'require',
    connection: {
        options: `project=${ENDPOINT_ID}`,
    },
});


router.get('/', async (req, res) => {
    try {
        const response = await sql`select * from users`;
        res.send(response);
    } catch (error) {
        console.error('Error Fetching Users:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

router.get('/:id', async (req, res) => {
    const userID = req.params.id;
    try {
        const response = await sql`select * from users where id = ${userID}`;
        if (response.length === 0) {
            res.status(404).send('User not found');
        } else {
            const result = response[0];
            res.send(result);
        }
    } catch (error) {
        console.error('Error Fetching User:', error);
    }
});
router.get('/username', async (req, res) => {
    const {username, password} = req.query;
    try {
        const response = await sql`
            SELECT * FROM users WHERE username = ${username} AND password = ${password}
        `;
        if (response.length === 0) {
            res.status(404).send('User not found');
        } else {
            const result = response[0];
            res.send(result);
        }
    } catch (error) {
        console.error('Error Fetching User:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/create', async (req, res) => {
    try {

        const {firstName, lastName, username, password} = req.body;
        const response = await sql`insert into users (first_name, last_name, username,password, role) values (${firstName}, ${lastName},${username},${password},'USER') returning *`;
        const newUser = response[0];
        res.send(newUser);
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

module.exports = router;