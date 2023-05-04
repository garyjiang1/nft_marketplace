const ipfsClient = require('ipfs-http-client');

const client = ipfsClient.create({
  host: 'localhost',
  port: 3001,
  protocol: 'http',
  apiPath: '/api/v0',
});

const IPFS_HASH = '2OxuC5YZ5HSCsp97xQrkWl1XFtP';

async function fetchContent() {
    try {
      let content = '';
  
      for await (const chunk of client.cat(IPFS_HASH)) {
        content += chunk.toString();
      }
  
      console.log('Content:', content);
    } catch (error) {
      console.error('Error fetching content from IPFS:', error);
    }
  }
  

fetchContent();
