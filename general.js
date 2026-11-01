const axios = require('axios');

/**
 * Client helpers for the expressBookReviews API.
 * Retrieves all books and book details by ISBN, author, and title
 * using Axios with promise callbacks and async/await.
 *
 * Endpoints (server on port 5000):
 *   GET /                  all books
 *   GET /isbn/:isbn        book by ISBN
 *   GET /author/:author    books by author
 *   GET /title/:title      books by title
 */

const BASE_URL = process.env.BOOKS_API_BASE_URL || 'http://localhost:5000';

// One shared client: reused connections, single timeout, no per-call setup.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: { Accept: 'application/json' }
});

function requireValue(value, name) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`${name} is required`);
  }
  return encodeURIComponent(String(value).trim());
}

/**
 * Task: retrieve all books.
 * Async/await with Axios.
 */
async function getAllBooks() {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to retrieve all books: ${error.message}`);
  }
}

/**
 * Task: retrieve a book by ISBN.
 * Promise callbacks (.then / .catch) with Axios.
 */
function getBookByISBN(isbn) {
  let encoded;
  try {
    encoded = requireValue(isbn, 'ISBN');
  } catch (error) {
    return Promise.reject(error);
  }

  return axios
    .get(`${BASE_URL}/isbn/${encoded}`, { timeout: 5000 })
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Failed to retrieve book by ISBN ${isbn}: ${error.message}`);
    });
}

/**
 * Task: retrieve books by author.
 * Async/await with Axios. Uses the author route instead of downloading
 * the full catalog and filtering on the client.
 */
async function getBooksByAuthor(author) {
  const encoded = requireValue(author, 'Author');
  try {
    const response = await api.get(`/author/${encoded}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to retrieve books by author "${author}": ${error.message}`);
  }
}

/**
 * Task: retrieve books by title.
 * Async/await with Axios. Uses the title route instead of downloading
 * the full catalog and filtering on the client.
 */
async function getBooksByTitle(title) {
  const encoded = requireValue(title, 'Title');
  try {
    const response = await api.get(`/title/${encoded}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to retrieve books by title "${title}": ${error.message}`);
  }
}

module.exports = {
  getAllBooks,
  getBookByISBN,
  getBooksByAuthor,
  getBooksByTitle
};

// Run only when executed directly: node general.js
if (require.main === module) {
  (async () => {
    try {
      console.log('All books:', await getAllBooks());
      console.log('Book by ISBN 1:', await getBookByISBN(1));
      console.log('Books by author:', await getBooksByAuthor('Jane Austen'));
      console.log('Books by title:', await getBooksByTitle('Fairy tales'));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  })();
}