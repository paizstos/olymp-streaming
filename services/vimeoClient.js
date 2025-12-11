const { Vimeo } = require('@vimeo/vimeo');

const clientId = process.env.VIMEO_CLIENT_ID;
const clientSecret = process.env.VIMEO_CLIENT_SECRET;
const accessToken = process.env.VIMEO_ACCESS_TOKEN;

if (!clientId || !clientSecret || !accessToken) {
  throw new Error(
    'VIMEO_CLIENT_ID / VIMEO_CLIENT_SECRET / VIMEO_ACCESS_TOKEN manquants. ' +
      'Ajoute-les dans ton .env (clés régénérées) avant de lancer le serveur.'
  );
}

const vimeoClient = new Vimeo(clientId, clientSecret, accessToken);

module.exports = vimeoClient;
