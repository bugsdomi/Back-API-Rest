// *************************************************************************
// *** Test EPSOR : Programme principal coté serveur            				 ***
// ***                                                                   ***
// *** Objet : srever.js                                              	 ***
// ***                                                                   ***
// *** Cet objet sert à gérer :                                          ***
// ***   - Les éléments de bas niveau (BDD, Mails, UpLoader, Express...) ***
// ***   - Les échanges avec les clients (API RestFull)         				 ***
// ***                                                                   ***
// ***  Nécessite :                                                      ***
// *** - Le module express																							 ***	
// *** - Le module path																									 ***
// *** - Le module fs 																									 ***
// ***                                                                   ***
// *************************************************************************
// -------------------------------------------------------------------------

const express     = require('express');
const path        = require('path');           // Module de gestion des chemins
const fs          = require('fs');             // Module permettant de lire / ecrire des fichiers

// -------------------------------------------------------------------------
// Variables, constantes
// -------------------------------------------------------------------------
let produitsJSON;         // Fichier JSON en mémoire
const app = express();

// -------------------------------------------------------------------------
// Création de l'application ExpressJS
// -------------------------------------------------------------------------

app.use('/static', express.static(__dirname + '/public'));
app.use('/staticNodeModules', express.static(__dirname + '/node_modules'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  return res.send('Hello World');
});

app.get('/products', (req, res) => {
  return res.send(Object.values(produitsJSON));
  // return res.send(produitsJSON);
});

app.get('/products/:id', (req, res) => {
  // return res.send(req.params.id);
  const productFound = produitsJSON.find(elem => { 
    elem.id == parseInt(req.params.id);
    
    console.log('---------------------------------')
    console.log('Elem : ',elem)
    console.log('req.params.id : ',req.params.id);
    console.log('elem.id : ',elem.id);
  });
  console.log('productFound : ',productFound) 
  console.log('---------------------------------')
  

  if (!productFound){
    res.status(404).send('Le product demandé n\'existe pas');
  } else {
    res.send(productFound);
}
});

app.get('/products/:year/:month', (req, res) => {
  return res.send(req.params);
  // return res.send(req.query);
  // return res.status(status).send(body)
});

app.post('/products/:id', (req, res) => {
  return res.send(produitsJSON[req.params.id-1]);
});

app.put('/products/:id', (req, res) => { 
  return res.send(
    `PUT HTTP method on product/${req.params.id} resource`,
  );
});

app.delete('/products/:id', (req, res) => {
});

// app.post('/messages', (req, res) => {
//   const id = uuidv4();
//   const message = {
//     id,
//     text: req.body.text,
//   };
//   messages[id] = message;
//   return res.send(message);
// });

// -------------------------------------------------------------------------
// Chargement en asynchrone du fichier JSON en mémoire
// -------------------------------------------------------------------------
function loadProduitsJSON(){
  const produitsDataFile = path.join(__dirname, '/public/datafile/produits.json');

  fs.readFile(produitsDataFile, (err, data) => {
    if (err) throw err;
    produitsJSON = JSON.parse(data);
    console.log('Produits chargés à partir du fichier JSON : ',produitsJSON);
  });
}

// -------------------------------------------------------------------------
// Création du serveur et lancement du listener
// Chargement en mémoire du fichier JSON
// -------------------------------------------------------------------------
const server = app.listen(process.env.PORT || 3000, function() {
	const addressHote = server.address().address;
	const portEcoute = server.address().port
  console.log('Écoute du serveur http://%s:%s',addressHote,portEcoute);
  
  loadProduitsJSON();
}); 