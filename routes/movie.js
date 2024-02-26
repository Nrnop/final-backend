const express = require('express');
const router = express.Router();
const postgres = require('postgres');


require('dotenv').config();

const sql = postgres({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PORT,
    ssl: process.env.SSL,
    connection: {
        options: `project=${process.env.ENDPOINT_ID}`,
    },
});

// router.get('/', async (_, response) => {
//     const movies = await sql`select * from movies`;
//     response.send(movies);
// });
router.get('/tags', async (_, response) => {
    const tags = await sql`select * from tags`;
    response.send(tags);
});
router.get('/stars', async (_, response) => {
    const stars = await sql`select * from stars`;
    response.send(stars);
});
router.get('/tags/:tagName', async (req, response) => {
    try {
        const tagName = req.params.tagName.toLowerCase();
        const movies = await sql`
            SELECT movies.* FROM movies
            JOIN movies_tags ON movies.id = movies_tags.movie_id
            JOIN tags ON movies_tags.tag_id = tags.tag_id
            WHERE LOWER(tags.tag_name) = ${tagName}
        `;
        response.json(movies);
    } catch (error) {
        console.error("Error fetching movies by tag:", error);
        response.status(500).send('Server error: ' + error.message);
    }
});


router.get('/years', async (req, res) => {
    try {
        const years = await sql `SELECT DISTINCT year FROM movies ORDER BY year DESC`;
        res.json(years);
    } catch (error) {
        console.error("Failed to fetch years:", error);
        res.status(500).send({ error: "Failed to fetch years from the database." });
    }
});
router.get('/year/:year', async (req, response) => {
    try {
        const { year } = req.params;
        const movies = await sql`
            SELECT * FROM movies
            WHERE year = ${year}
        `;
        response.json(movies);
    } catch (error) {
        console.error("Error fetching movies by year:", error);
        response.status(500).send('Server error: ' + error.message);
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the movie by ID
        const movies = await sql`SELECT * FROM movies WHERE id = ${id}`;

        if (movies.length > 0) {
            const movie = movies[0];

            // Fetch stars related to the movie
            const stars = await sql`
                SELECT s.name 
                FROM stars s 
                INNER JOIN movies_stars ms ON s.star_id = ms.star_id 
                WHERE ms.movie_id = ${id}
            `;

            // Fetch tags related to the movie
            const tags = await sql`
                SELECT t.tag_name 
                FROM tags t 
                INNER JOIN movies_tags mt ON t.tag_id = mt.tag_id 
                WHERE mt.movie_id = ${id}
            `;

            // Combine the movie info with its stars and tags
            const result = {
                ...movie,
                stars: stars.map(s => s.name),
                tags: tags.map(t => t.tag_name)
            };

            res.json(result);
        } else {
            res.status(404).send('Movie not found');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
router.get('/', async (req, res) => {
    try {
        // Fetch all movies
        const movies = await sql`SELECT * FROM movies`;

        // Initialize an array to hold the final result
        let results = [];

        // Loop through each movie to fetch its stars and tags
        for (const movie of movies) {
            // Fetch stars related to the movie
            const stars = await sql`
                SELECT s.name 
                FROM stars s 
                INNER JOIN movies_stars ms ON s.star_id = ms.star_id 
                WHERE ms.movie_id = ${movie.id}
            `;

            // Fetch tags related to the movie
            const tags = await sql`
                SELECT t.tag_name 
                FROM tags t 
                INNER JOIN movies_tags mt ON t.tag_id = mt.tag_id 
                WHERE mt.movie_id = ${movie.id}
            `;

            // Combine the movie info with its stars and tags
            const result = {
                ...movie,
                stars: stars.map(s => s.name),
                tags: tags.map(t => t.tag_name)
            };

            // Add the combined movie info to the results array
            results.push(result);
        }

        // Send the results as JSON
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});






module.exports = router;