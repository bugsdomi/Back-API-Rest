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
const path        = require('path');                          // Module de gestion des chemins
const fs          = require('fs');                            // Module permettant de lire / ecrire des fichiers

// -------------------------------------------------------------------------
// Définition Variablesdes et Constantes
// -------------------------------------------------------------------------
const produitsDataFile = path.join(__dirname, '/public/datafile/produits.json');  // Emplacement et nom du fichier JSON
let produits;                                                 // Fichier-mémoire des des produits issus du Fichier JSON
let productModified = false;                                  // Témoin de modifictaions du fichier "Produits" 
const refreshJSONFileInterval = 60000;                        // Délai d'interrogation de copie du Fichier-Mémoire vers le fichier physique
const app = express();                                        // Application Serveur API RestFul

// -------------------------------------------------------------------------
// Création de l'application ExpressJS
// -------------------------------------------------------------------------
app.use('/static', express.static(__dirname + '/public'));    // Définition du chemin des assets
app.use(express.json());                                      // Activation du parsing dans "Express"





// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// API RestFul - Gestion des messages
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// Message initial à la connexion
// -------------------------------------------------------------------------
app.get('/', (req, res) => {
  return res.send('<h1 style="color: red;">Bonjour EPSOR, <p>Ceci est le test d\'embauche pour le poste de "Full Stack Developer"</p></h1>');
});
// -------------------------------------------------------------------------
// Liste des produits
// -------------------------------------------------------------------------
app.get('/products', (req, res) => {
  return res.send(Object.values(produits));
});

// -------------------------------------------------------------------------
// Recherche d'un produit
// avec contrôle de l'existance du produit
// -------------------------------------------------------------------------
app.get('/products/:id', (req, res) => {

  // Si non trouvé, message d'erreur et echap
  const produitTrouve = produits.find(produit => produit.id === parseInt(req.params.id));
  if (!produitTrouve){
    return res.status(404).send('Le produit demandé n\'existe pas');
  } 

  res.send(produitTrouve);
});

// -------------------------------------------------------------------------
// Création d'un nouveau produit
// avec vérification que tous les champs sont remplis
// -------------------------------------------------------------------------
app.post('/products', (req, res) => {

  // Si déjà existant, message d'erreur et echap
  const indexProduit = produits.findIndex(produit => produit.id === parseInt(req.body.id));
  if (indexProduit !== -1){
    return res.status(400).send('Le nouveau produit demandé existe déjà');
  }; 


  // Check validité de l'objet envoyé
  if (!validateProduct(req.body)){
    return res.status(400).send('Tous les champs du produit sont obligatoires')
  }

  // Constitution d'un objet pour le nouveau produit et ajout dans le fichier-mémoire
  const newProduct = {
    id    : req.body.id,
    uuid  : req.body.uuid,
    name  : req.body.name,
    price : req.body.price,
    type  : req.body.type,
    enable: req.body.enable 
  }

  produits.push(newProduct);
  productModified = true;
  res.send(newProduct);
});

// -------------------------------------------------------------------------
// MAJ d'un produit
// avec contrôle de l'existance du produit
// avec vérification que tous les champs sont remplis
// -------------------------------------------------------------------------
app.put('/products/:id', (req, res) => { 

  // Si non trouvé, message d'erreur et echap
  const indexProduit = produits.findIndex(produit => produit.id === parseInt(req.params.id));
  if (indexProduit === -1){
    return res.status(404).send('Le produit demandé n\'existe pas');
  }; 
  
  // Check validité de l'objet envoyé
  if (!validateProduct(req.body)){
    return res.status(400).send('Tous les champs du produit sont obligatoires')
  }

  // MAJ de l'objet "produit" dans le fichier-mémoire
  produits[indexProduit] = {
    id    : req.body.id,
    uuid  : req.body.uuid,
    name  : req.body.name,
    price : req.body.price,
    type  : req.body.type,
    enable: req.body.enable
  }

  productModified = true;
  res.send(produits[indexProduit]);
});

// -------------------------------------------------------------------------
// Suppression d'un produit
// -------------------------------------------------------------------------
app.delete('/products/:id', (req, res) => {
  
  // Si non trouvé, message d'erreur et echap
  const produitTrouve = produits.find(produit => produit.id === parseInt(req.params.id)); // Sauvegarde du produit pour le renvoyer à la fin de la fonction
  if (!produitTrouve){
    return res.status(404).send('Le produit demandé n\'existe pas');
  }; 

  const index = produits.indexOf(produitTrouve);
  produits.splice(index, 1);
  productModified = true;
  res.send(produitTrouve); 
});

// -------------------------------------------------------------------------
// Gardé pour didacticiel (récupération des éléments de requête, et du corps du message)
// -------------------------------------------------------------------------
app.get('/products/:year/:month', (req, res) => {
  return res.send(req.params);
  // return res.send(req.query);
  // return res.status(status).send(body)
});

// -------------------------------------------------------------------------
// Check validité de l'objet envoyé
// -------------------------------------------------------------------------
function validateProduct(pProduct){
  // Si au moins 1 champs n'est pas rempli, message d'erreur ==> False
  if (!pProduct.id ||
      !pProduct.uuid ||  
      !pProduct.name ||
      !pProduct.price ||
      !pProduct.type ||
      !pProduct.enable) {
    return false
  } else {
    return true;
  }
}

// -------------------------------------------------------------------------
// Chargement du fichier JSON en mémoire
// -------------------------------------------------------------------------
function sortById(p1, p2){
  return ((p1.id < p2.id) ? -1 
                          : ((p1.id > p2.id)  ? 1 
                                              : 0));
  }

// -------------------------------------------------------------------------
// Chargement du fichier JSON en mémoire
// -------------------------------------------------------------------------
function loadProduitsJSON(){
  fs.readFile(produitsDataFile, (err, data) => {
    if (err || data.length === 0) {                           // Si fichier JSON inexistant 
      produits = [];                                          // Initialisation à vide du fichier-mémoire
      console.log('Fichier "Produits" vierge');
    } else {
      produits = JSON.parse(data);                            // Dé-JSONification du fichier et copie en fichier-mémoire;
      produits.sort(sortById);                                // Tri sur l'Id 
      console.log('Produits chargés à partir du fichier JSON');
    }
  });
}

// -------------------------------------------------------------------------
// Sauvegarde du Fichier-mémoire vers le fichier physique si témoin de modification = true
// -------------------------------------------------------------------------
function saveProduitsJSON(){
  if (productModified){                                       // S'il y a eu des opérations CRUD
    produits.sort(sortById);                                  // Tri sur l'Id 
    const produitJSON = JSON.stringify(produits, null, 2);    // JSONification du fichier-mémoire et copie vers le fichier physique;
    
    fs.writeFile(produitsDataFile, produitJSON, (err) => {    // Ecrasement de l'ancien fichier, création d'un nouveau et sauvegarde du fichier-mémoire vers fichier physique
      if (err) {
        console.log('-------------------------------------------------------------');
        console.log(`Erreur dans la fonction 'saveProduitsJSON' : ${err} lors de l'écriture de "]"`);   // Si erreur technique... Message et Plantage
        console.log('-------------------------------------------------------------');
        throw err;
      } else {
        productModified = false;
        console.log('Fichier JSON MAJ');
      }
    });
  }
}

// -------------------------------------------------------------------------
// Création du serveur et lancement du listener
// Chargement en asynchrone en mémoire du fichier JSON (loadProduitsJSON)
// -------------------------------------------------------------------------
const server = app.listen(process.env.PORT || 3000, function() {
	const addressHote = server.address().address;
	const portEcoute = server.address().port
  console.log('Écoute du serveur http://%s:%s',addressHote,portEcoute);
  
  loadProduitsJSON();                                         // Chargement du fichier en JSON en mémoire

  setInterval(() => {
    saveProduitsJSON();                                       // Tentative de sauvegarde périodique du Fichier-mémoire vers le fichier physique si témoin de modification = true
  }, refreshJSONFileInterval);
});
