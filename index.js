const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 5000;

// Enable CORS
app.use(cors());

// Pexels API Key (use your own key here)
const PEXELS_API_KEY = 'vXgAaI5rM6VUp69yz82DZ0UyiFBb6KjTdMyy5sBPHacXdrTEGJfcHFCt'; // Replace with your actual Pexels API key
// Pixabay API Key (use your own key here)
const PIXABAY_API_KEY = '49398631-8d073cc29f9713958a6d1347c'; // Replace with your actual Pixabay API key

// Scraping function for multiple stock platforms
const scrapeImagePrices = async (searchTerm, platform, page = 1) => {
  const prices = [];
  const perPage = 10; // Number of images per page

  try {
    // Fetch images from Pexels if platform is "pexels" or undefined
    if (!platform || platform === 'pexels') {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${searchTerm}&per_page=${perPage}&page=${page}`;
      const pexelsResponse = await axios.get(pexelsUrl, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (pexelsResponse.data.photos.length > 0) {
        pexelsResponse.data.photos.forEach((photo) => {
          prices.push({
            platform: 'Pexels',
            price: 'Free',
            imageUrl: photo.src.medium, // Image URL
            originalUrl: photo.url, // Pexels original image page URL
          });
        });
      }
    }

    // Fetch images from Pixabay if platform is "pixabay" or undefined
    if (!platform || platform === 'pixabay') {
      const pixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${searchTerm}&image_type=photo&per_page=${perPage}&page=${page}`;
      const pixabayResponse = await axios.get(pixabayUrl);

      if (pixabayResponse.data.hits.length > 0) {
        pixabayResponse.data.hits.forEach((image) => {
          prices.push({
            platform: 'Pixabay',
            price: 'Free',
            imageUrl: image.webformatURL, // Image URL
            originalUrl: image.pageURL, // Pixabay original image page URL
          });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching data from APIs', error);
  }

  return prices;
};

// Search endpoint to get prices for a keyword
app.get('/search', async (req, res) => {
  const { query, filter, platform, page = 1 } = req.query; // Get the search term, filter, platform, and page from query parameters
  if (!query) {
    return res.status(400).send('No search term provided');
  }

  try {
    let prices = await scrapeImagePrices(query, platform, page); // Pass page number to scrapeImagePrices function

    // Filter based on the 'filter' query parameter (free or paid)
    if (filter) {
      prices = prices.filter(price => price.price.toLowerCase() === filter.toLowerCase());
    }

    res.json({ prices, page });
  } catch (error) {
    console.error('Error processing search', error);
    res.status(500).send('Error processing search');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
