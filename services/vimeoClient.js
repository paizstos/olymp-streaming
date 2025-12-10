const { Vimeo } = require('@vimeo/vimeo');

// Ces valeurs viennent de ton app Vimeo
const clientId = process.env.VIMEO_CLIENT_ID || '6b1ef2eaa40b2af70af6da8ed532b7a6d8f39b48';
const clientSecret = process.env.VIMEO_CLIENT_SECRET || '/pu6yqK5cQT1HiY05tEDbzZpANSL3iwMyOz/byXUTo2XwFegFl6RDhe4TPWffxIyX/8GUmORGX3Zcx0QWQVK7bQNQUaxQiZnHnIUamzewMzCAlnTov3aeA4LV6m3m8l+';
const accessToken = process.env.VIMEO_ACCESS_TOKEN || 'e60c5b39fac464ea97ed62b541ed0330';

const vimeoClient = new Vimeo(clientId, clientSecret, accessToken);

module.exports = vimeoClient;
