const express = require('express');
const router = express.Router();
const postgres = require('postgres');
PGHOST = 'ep-super-shadow-47901102.us-east-2.aws.neon.tech'
PGDATABASE = 'FinalProject'
PGUSER = 'nuranabipour'
PGPASSWORD = 'OlFpt25LeZDM'
ENDPOINT_ID = 'ep-super-shadow-47901102'

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


router.post('/sign-up', async (req, res) => {
    try {

        const {firstName, lastName, username, password} = req.body;
        const response = await sql`insert into users (first_name, last_name, username,password, role) values (${firstName}, ${lastName},${username},${password},'USER') returning *`;
        const newUser = response[0];
        res.send(newUser);
    } catch (error) {
        console.error('Error adding user:', error);
    }
});
router.post('/login', async (req, res) => {

    const {username, password} = req.body;
    const foundUser = await sql`select * from users where username =${username} and password =${password}`;
    if (foundUser && foundUser.length > 0) {
        res.send({
            user: {
                id: foundUser[0].id,
                username: foundUser[0].username,
                first_name: foundUser[0].first_name,
                last_name: foundUser[0].last_name,
                role: foundUser[0].role
            }
        });
    } else {
        res.send({error: true, message: 'Wrong Username and/or Password'});
    }

});

router.get('/:id/watchlist', async (req, res) => {
    const userId = req.params.id;
    try {
        const response = await sql`
            SELECT movies.* 
            FROM movies
            JOIN users_movies ON movies.id = users_movies.movie_id
            WHERE users_movies.user_id = ${userId}
        `;

        if (response.length === 0) {
            res.status(404).send('No movies found in watchlist');
        } else {
            res.json(response);
        }
    } catch (error) {
        console.error('Error Fetching Watchlist:', error);
        res.status(500).send('Server error');
    }
});

router.post('/manageWatchlist', async (req, res) => {
    try {
        const { movie_id, user_id } = req.body;

        // check if the movie is already in the user's watchlist
        const checkResponse = await sql`select * from users_movies where movie_id = ${movie_id} and user_id = ${user_id}`;

        if (checkResponse.length > 0) {
            // If the movie is in the watchlist, remove it
            const deleteResponse = await sql`delete from users_movies where movie_id = ${movie_id} and user_id = ${user_id} returning *`;
            res.send({ message: "Movie removed from watchlist", movie: deleteResponse[0] });
        } else {
            // If the movie is not in the watchlist, add it
            const insertResponse = await sql`insert into users_movies (movie_id, user_id) values (${movie_id}, ${user_id}) returning *`;
            res.send({ message: "Movie added to watchlist", movie: insertResponse[0] });
        }
    } catch (error) {
        console.error('Error modifying watchlist:', error);
        res.status(500).send('Server error');
    }
});

router.get('/:userId/isMovieInWatchlist/:movieId', async (req, res) => {
    try {
        const { userId, movieId } = req.params; // Extracting userId and movieId from URL parameters

        // Query to check if the movie is already in the user's watchlist
        const checkResponse = await sql`SELECT EXISTS(SELECT 1 FROM users_movies WHERE movie_id = ${movieId} AND user_id = ${userId})`;

        // Since we're using EXISTS, the query will return a boolean inside an object, e.g., { exists: true }
        const isInWatchlist = checkResponse[0].exists;

        res.send({ isInWatchlist }); // Send back the boolean result
    } catch (error) {
        console.error('Error checking watchlist:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;