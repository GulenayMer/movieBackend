const express = require('express');
require('dotenv/config');
const { Pool } = require('pg');
const cors = require('cors');

// instantiations
const app = express();
const port = process.env.PORT || 8000;
const pool = new Pool({
	connectionString: process.env.ELEPHANT_SQL_CONNECTION_STRING,
})

// usage
app.use(express.json());
app.use(cors());

/* -------- DATA --------- */
// 1) GET ALL MOVIES
app.get('/api/movies', (req,res) =>{
	pool
		.query('SELECT * FROM movies;')
		.then(data => {
			return res.json(data.rows)
		})
		.catch(e => {
			res.status(500).json( {message : e.message})
		});
});

// 2) GET SINGLE MOVIE
app.get(`/api/movies/:id`, (req,res) =>{
	const { id }= req.params;
	const query = 'SELECT * FROM movies WHERE id=$1';
	pool
		.query(query, [id])
		.then(data => {
			if ( data.rowCount === 0 ){
				res.status(404).json( {message: 'Movie not found'})
			}else{
				res.json(data.rows[0])
			}
		})
		.catch(e => {
			res.status(500).json( {message: e.message})
		});
});

// 3) POST
app.post('/api/movies', (req,res) => {
	const { title, director, year, rating, poster } = req.body;
	const query = 'INSERT INTO movies (title, director, year, rating, poster ) VALUES ($1, $2, $3, $4, $5) RETURNING *';
	pool
		.query(query, [title, director, year, rating, poster])
		.then(data => res.status(201).json(data.rows[0]))
		.catch( e => res.status(500).json({message: e.message}));
});

// 4) PUT
app.put('/api/movies/:id', (req, res) => {
	const { id } = req.params;
	const { title, director, year, rating, poster } = req.body;
	const query = 'UPDATE movies SET title =$1, director=$2, year=$3, rating=$4, poster=$5 WHERE id=$6 RETURNING *';
	pool
		.query(query, [id, title, director, year, rating, poster])
		.then(data => res.status(202).json(data.rows[0]))
		.catch(e => res.status(500).json({message:e.message}));
})

app.delete('/api/movies/:id', (req, res) => {
	const { id } = req.params;
	const query = 'DELETE FROM movies WHERE id=$1 RETURNING *;'
	pool
		.query(query, [id])
		.then( data => res.status(500).json(data.rows[0]))
		.catch(e => res.status(500).json({message: e.message}));
})

app.listen(port, () =>{
	console.log(`server listening ${port}`);
})