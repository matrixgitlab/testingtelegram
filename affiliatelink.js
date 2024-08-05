const puppeteer = require('puppeteer');

async function scrapePage(aliexpressUrl) {
  const browser = await puppeteer.launch({ headless: true,
                                         executablePath: '/opt/render/.cache/puppeteer/chrome/linux-126.0.6478.126/chrome-linux64/chrome',
                                         cacheDir: '/opt/render/.cache/puppeteer'});
  const page = await browser.newPage();

  // Définir un cookie spécifique
  const cookie = {
    name: 'xman_t',
    value: 'KDORcexyxtgg9djAiFWWNJD1+79wj5mHz5lQCF5e20DZ0Q2JCjHMMGcswHrcOih8mPILD/XdYSKFmdTHFXHYLIdcsWHPEqHPBEOhUCI3aEu7OWHVdH5B/XTiuthuCQHnB6kErlC2KavZGOLtzLUzI7uGCWcHUoUXHpoFrbPyPfMw6gvF8AKz+IBzszv3+F9/GGVGQ6JFTeHjG/e/+dA2Qp+fBvSfxzzWfe1+uSiZL0JF3DQH0HQSkaiTrywjgJU6HI8aK51BZKuk6Ed6IvORAoOx+pcsB+Un0OMyMhAvbw0BCGurhWmDlkutJxgTlslcboGfXp7WizJXHhazR12BwXwdh7GH3bWCdy1Oa9TWj4D6l1M3K57vUaSdWpedzE/AtNCFga9EBQrHxv4lguxrKc92rr+TA9M234oQ3iXlZ2TuA6qCa8wtJC0VH5r9yJLuRb7hDBGTKGFIOGm7uSzLP/8n+OPTkeJ9fN9pHIb/cwt85buDqEKBy13/kwIHoUDMozopBApjqR3YKkJ6mqU0evjbTSmhzB8nlhteNxEAZLLcY4B1iYC1nYT5cIuM4FCSq1Q9Zik57MozByD/AIyOIVkFM3ngLAOruD842AOruy4g8yIQyYEl788J6lCbbgIiIrYipVXC2WAohUIk7HTQVVrtn4D5syxERuwTeO0uQV5JQrkVRZLAyOe37OfboEbV1LCoCf2PRyUcVfAt5Xy27TaYAebVXd6UYyYuinxqAn+TPWdwLy3TRzeUNw89kB17',
    domain: 'portals.aliexpress.com',  // Remplacez par le domaine du site web
    path: '/',              // Chemin du cookie, généralement '/'
    httpOnly: false,        // Définir sur true si le cookie est HTTP only
    secure: true           // Définir sur true si le cookie est sécurisé
  };

  // Charger le cookie dans la page
  await page.setCookie(cookie);

  // Accéder à la page désirée
  await page.goto('https://portals.aliexpress.com/affiportals/web/link_generator.htm?spm=0._cps_dada.0.0.14e95e863x1WSb',{ timeout: 50000 }); // Remplacez par l'URL souhaitée

  // Attendre que la page soit complètement chargée
  await page.waitForSelector('#targetUrl', { timeout: 30000 }); // Attendre jusqu'à 10 secondes

   // Insérer l'URL dans le textarea
   const urlToInsert = aliexpressUrl;
   await page.type('#targetUrl', urlToInsert);
 
   // Cliquer sur le bouton "Get Tracking Link"
   await page.click('.next-btn.next-large.next-btn-primary.link-form-submit');
 
// Pause de 30 secondes
console.log('Attente de 10 secondes...');
await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 30 000 millisecondes

   // Récupérer le contenu du textarea readonly
  const result = await page.evaluate(() => {
    const textareas = document.querySelectorAll('textarea');
    const values = [];
    textareas.forEach(textarea => {
      values.push(textarea.value);
    });
    return values[1];
  });
 
   console.log('Contenu récupéré:', result);

 await browser.close();
 return result;
}

module.exports = scrapePage;
