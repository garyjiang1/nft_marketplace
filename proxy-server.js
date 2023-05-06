const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ipfsClient = require('ipfs-http-client');
const cors = require('cors');
const path = require('path');

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

// Add CORS middleware
app.use(cors());

app.use('/api/v0', createProxyMiddleware({
  target: 'https://ipfs.infura.io:5001',
  changeOrigin: true,
  onProxyReq(proxyReq) {
    // Set the authorization header for the proxy request
    proxyReq.setHeader('Authorization', `Basic ${Buffer.from(infuraApiKey).toString('base64')}`);
  },
}));

app.get('/ipfs/:hash', async (req, res) => {
  const { hash } = req.params;

  try {
    const content = await client.cat(hash);
    const chunks = [];
    for await (const chunk of content) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const fileExtension = path.extname(buffer.slice(0, 10).toString());
    const mimeType = getMimeType(fileExtension);
    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  } catch (error) {
    console.error("Error fetching content from IPFS:", error);
    res.status(500).send("Internal Server Error");
  }
});

function getMimeType(extension) {
  switch (extension) {
    case '.jpeg':
    case '.jpg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

app.listen(3001, () => {
  console.log('Proxy server running on port 3001, forwarding requests to Infura IPFS API');
});
