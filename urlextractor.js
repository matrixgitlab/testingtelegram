const axios = require('axios');

// Fonction pour obtenir l'URL finale d'un lien
const getProductUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: status => status === 302,
    });

    const redirectedUrl = response.headers.location;

    if (redirectedUrl) {
      return redirectedUrl;
    } else {
      throw new Error('Redirection failed or no location header found.');
    }
  } catch (error) {
    throw new Error(`Error fetching URL for ${url}: ${error.message}`);
  }
};

// Fonction pour extraire les URL du texte et obtenir les URL finales
const extractAndResolveUrls = async (text) => {
  // Utilisation d'une expression régulière pour trouver les URL
  const regex = /https:\/\/s\.click\.aliexpress\.com\/e\/[^\s]+/g;

  // Extraction des URL
  const urls = text.match(regex);

  if (!urls) {
    throw new Error('No URLs found.');
  }

  const finalUrls = [];

  for (const url of urls) {
    try {
      const finalUrl = await getProductUrl(url);
      finalUrls.push(finalUrl);
    } catch (error) {
      console.error(error.message);
    }
  }

  return finalUrls;
};

/* Exemple d'utilisation
const text = `✅عروض Choice
✅تخفيض مقابل العملات 
✅الثمن بعد التخفيض : 83 درهم
✅رابط الشراء 👇
https://s.click.aliexpress.com/e/_DFtylaP

✅رابط صفحة العملات 👇
https://s.click.aliexpress.com/e/_DDGbtV5`;

extractAndResolveUrls(text)
  .then(finalUrls => {
    console.log('Final URLs:', finalUrls);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });*/

module.exports = { extractAndResolveUrls };