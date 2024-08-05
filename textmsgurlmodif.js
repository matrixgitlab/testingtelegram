const axios = require('axios');
const puppeteer = require('puppeteer');
const scrapePage = require('./affiliatelink.js'); // Assurez-vous que le chemin du fichier est correct


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

// Fonction pour extraire la partie souhaitée de l'URL finale
const extractFinalPart = (url) => {
  
  const regex = /(\d+\.html)/;//(\d+\.html)/;
  const match = url.match(regex);
  //console.log(match);
  if (match) {
    return match[1];
  } else {
    throw new Error(`URL does not contain the expected part: ${url}`);
  }
};

// Fonction pour extraire les URL du texte, obtenir les URL finales, et remplacer les URL dans le texte
const extractAndResolveUrls = async (text) => {
  // Utilisation d'une expression régulière pour trouver les URL
  const regex = /https:\/\/s\.click\.aliexpress\.com\/e\/[^\s]+/g;

  // Extraction des URL
  const urls = text.match(regex);

  if (!urls) {
    throw new Error('No URLs found.');
  }

  let validFinalPart = null;
  let lastExtractedPart = null;
  let modifiedText = text;

  for (const url of urls) {
    try {
      const finalUrl = await getProductUrl(url);
      const extractedPart = extractFinalPart(finalUrl);
      lastExtractedPart = extractedPart; // Met à jour la dernière partie extraite
      if (/^\d+\.html$/.test(extractedPart)) { // Vérifie si la partie extraite correspond au format souhaité
        
        validFinalPart = extractedPart;

      }
    } catch (error) {
      console.error(error.message);
    }
  }

  // Si aucune partie extraite valide n'a été trouvée, utiliser la dernière partie extraite
  const partToUse = validFinalPart || lastExtractedPart;

  if (!partToUse) {
    throw new Error('No valid or fallback part extracted.');
  }

  // Remplacer toutes les URL initiales par la partie extraite choisie
  try {
    console.log('Waiting for creation the affiliate link of : ', 'https://www.aliexpress.com/item/'+partToUse)
    const results = await scrapePage('https://www.aliexpress.com/item/'+partToUse);
    console.log('Résultats:', results);
    const replacedUrl = results;
    modifiedText = text.replace(regex, replacedUrl);

    return { modifiedText, finalPart: partToUse, replacedUrl };
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script Puppeteer:', error);
    const replacedUrl = 'https://www.aliexpress.com/item/'+partToUse;
    modifiedText = text.replace(regex, replacedUrl);

    return { modifiedText, finalPart: partToUse, replacedUrl };
    
  }

};

/* Exemple d'utilisation
const text = ` شاحن usb 🔥 ب 99 درهم تخفيض بالعملات 🤩 و قبل التخفيض ب 120 درهم ✅
https://s.click.aliexpress.com/e/_DeT2XMj `;

extractAndResolveUrls(text)
  .then(result => {
    console.log('Modified Text:', result.modifiedText);
    console.log('Final Part:', result.finalPart);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
*/
module.exports = { extractAndResolveUrls };