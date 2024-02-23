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

router.get('/', async (_, response) => {
    const movies = await sql`select * from movies`;
    response.send(movies);
});
router.get('/tags', async (_, response) => {
    const tags = await sql`select * from tags`;
    response.send(tags);
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

module.exports = router;