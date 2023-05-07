import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'

const ipfsClient = require('ipfs-http-client');

const client = ipfsClient.create({
  host: 'localhost',
  port: 3001,
  protocol: 'http',
  apiPath: '/api/v0',
});

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file)
        console.log(result)
        setImage(`http://localhost:3001/ipfs/${result.path}`)
      } catch (error) {
        console.log("ipfs image upload error: ", error)
        alert(`Failed to upload IPFS image: ${error}`)
      }
    }
  }
  const createNFT = async () => {
    if (!image || !price || !name || !description) return
    try{
      const result = await client.add(JSON.stringify({image, price, name, description}))
      mintThenList(result)
    } catch(error) {
      console.log("ipfs uri upload error: ", error)
      alert(`Failed to create NFT: ${error}`)
    }
  }
  const mintThenList = async (result) => {
    try {
      const uri = `http://localhost:3001/ipfs/${result.path}`
      // mint nft 
      await (await nft.mint(uri)).wait()
      // get tokenId of new nft 
      const id = await nft.tokenCount()
      // approve marketplace to spend nft
      await (await nft.setApprovalForAll(marketplace.address, true)).wait()
      // add nft to marketplace
      const listingPrice = ethers.utils.parseEther(price.toString())
      await (await marketplace.makeItem(nft.address, id, listingPrice)).wait()
      // add create alert
      alert('NFT created and listed successfully!');
    } catch (error) {
      console.log(`Failed to create and list NFT: ${error}`);
      alert(`Failed to create and list NFT: ${error}`);
    }
  }
  
  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create