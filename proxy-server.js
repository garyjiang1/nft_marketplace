const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ipfsClient = require('ipfs-http-client');

const app = express();

const infuraApiKey = '2OxuC5YZ5HSCsp97xQrkWl1XFtP:010969fa0d4855f265eb027c14837cfb';

const client = ipfsClient.create({
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(infuraApiKey).toString('base64')}`,
  },
});

app.use('/', createProxyMiddleware({
  target: 'https://ipfs.infura.io:5001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v0': '/api/v0', // Rewrite the path to keep the '/api/v0' prefix
  },
  onProxyReq(proxyReq) {
    // Set the authorization header for the proxy request
    proxyReq.setHeader('Authorization', `Basic ${Buffer.from(infuraApiKey).toString('base64')}`);
  },
}));

app.get('/ipfs/:hash', async (req, res) => {
  const { hash } = req.params;

  try {
    const content = await client.cat(hash);
    for await (const chunk of content) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    console.error("Error fetching content from IPFS:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on port 3001, forwarding requests to Infura IPFS API');
});
