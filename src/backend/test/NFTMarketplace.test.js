const { expect } = require("chai"); 

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NFTMarketplace", function () {

  let NFT;
  let nft;
  let Marketplace;
  let marketplace
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let feePercent = 1;
  let URI = "sample URI"

  beforeEach(async function () {
    // Get the ContractFactories and Signers here.
    NFT = await ethers.getContractFactory("NFT");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contracts
    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(feePercent);
  });

  describe("Deployment", function () {

    it("Successful: Should track name and symbol of the nft collection", async function () {
      const nftName = "DApp NFT";
      const nftSymbol = "DAPP";
      expect(await nft.name()).to.equal(nftName);
      expect(await nft.symbol()).to.equal(nftSymbol);
    });
  
    it("Unsuccessful: Should fail when the name or symbol of the nft collection is incorrect", async function () {
      const incorrectNftName = "Wrong NFT Name";
      const incorrectNftSymbol = "WRONG";
      expect(await nft.name()).not.to.equal(incorrectNftName);
      expect(await nft.symbol()).not.to.equal(incorrectNftSymbol);
    });
  
    it("Successful: Should track feeAccount and feePercent of the marketplace", async function () {
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  
    it("Unsuccessful: Should fail when feeAccount or feePercent of the marketplace is incorrect", async function () {
      const incorrectFeeAccount = addr1.address;
      const incorrectFeePercent = 20;
      expect(await marketplace.feeAccount()).not.to.equal(incorrectFeeAccount);
      expect(await marketplace.feePercent()).not.to.equal(incorrectFeePercent);
    });
  });  

  describe("Creating new NFTs", function () {

    it("Successful: Should track each minted NFT", async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);
      // addr2 mints an nft
      await nft.connect(addr2).mint(URI)
      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  
    it("Unsuccessful: Should fail when trying to mint an NFT with an empty URI", async function () {
      const emptyURI = "";
      // Expect minting an NFT with an empty URI to be rejected
      await expect(nft.connect(addr1).mint(emptyURI)).to.be.revertedWith("Invalid URI");
    });
  });

  describe("Listing NFTs for sale and transfer NFT ownerships:", function () {
    let price = 1
    let result 
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
    })


    it("Successful: Should track newly created item, transfer NFT from seller to marketplace and emit Offered event", async function () {
      // addr1 offers their nft at a price of 1 ether
      await expect(marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(price)))
        .to.emit(marketplace, "Offered")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address
        )
      // Owner of NFT should now be the marketplace
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      // Item count should now equal 1
      expect(await marketplace.itemCount()).to.equal(1)
      // Get item from items mapping then check fields to ensure they are correct
      const item = await marketplace.items(1)
      expect(item.itemId).to.equal(1)
      expect(item.nft).to.equal(nft.address)
      expect(item.tokenId).to.equal(1)
      expect(item.price).to.equal(toWei(price))
      expect(item.sold).to.equal(false)
    });

    it("Unsuccessful: Should fail if price is set to zero", async function () {
      await expect(
        marketplace.connect(addr1).makeItem(nft.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });

  });
  describe("Purchasing marketplace items", function () {
    let price = 2
    let fee = (feePercent/100)*price
    let totalPriceInWei
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend tokens
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
      // addr1 makes their nft a marketplace item.
      await marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(price))
    })
    it("Successful: Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
      const sellerInitalEthBal = await addr1.getBalance()
      const feeAccountInitialEthBal = await deployer.getBalance()
      // fetch items total price (market fees + item price)
      totalPriceInWei = await marketplace.getTotalPrice(1);
      // addr 2 purchases item.
      await expect(marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei}))
      .to.emit(marketplace, "Bought")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address,
          addr2.address
        )
      const sellerFinalEthBal = await addr1.getBalance()
      const feeAccountFinalEthBal = await deployer.getBalance()
      // Item should be marked as sold
      expect((await marketplace.items(1)).sold).to.equal(true)
      // Seller should receive payment for the price of the NFT sold.
      expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitalEthBal))
      // feeAccount should receive fee
      expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
      // The buyer should now own the nft
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    })
    it("Unsuccessful: Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
      // fails for invalid item ids
      await expect(
        marketplace.connect(addr2).purchaseItem(2, {value: totalPriceInWei})
      ).to.be.revertedWith("item doesn't exist");
      await expect(
        marketplace.connect(addr2).purchaseItem(0, {value: totalPriceInWei})
      ).to.be.revertedWith("item doesn't exist");
      // Fails when not enough ether is paid with the transaction. 
      // In this instance, fails when buyer only sends enough ether to cover the price of the nft
      // not the additional market fee.
      await expect(
        marketplace.connect(addr2).purchaseItem(1, {value: toWei(price-0.1)})
      ).to.be.revertedWith("not enough ether"); 
      // addr2 purchases item 1
      await marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei})
      // addr3 tries purchasing item 1 after its been sold 
      const addr3 = addrs[0]
      await expect(
        marketplace.connect(addr3).purchaseItem(1, {value: totalPriceInWei})
      ).to.be.revertedWith("item already sold");
    });
  })

  describe("Removing NFTs from sale", function () {
    let price = 1

    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
      // addr1 makes their nft a marketplace item.
      await marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(price))
    })

    it("Successful: Should remove item from sale, transfer NFT back to seller and emit RemovedFromSale event", async function () {
      // addr1 removes their nft from sale
      await expect(marketplace.connect(addr1).removeFromSale(1))
        .to.emit(marketplace, "RemovedFromSale")
        .withArgs(
          1,
          nft.address,
          1,
          addr1.address
        )
      // Owner of NFT should now be addr1 (the seller)
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      // Item should not be available for sale anymore
      expect((await marketplace.items(1)).sold).to.equal(true)
    });

    it("Unsuccessful: Should fail if item is already sold or if called by someone other than the seller", async function () {
      // addr2 tries to remove item 1 from sale
      await expect(
        marketplace.connect(addr2).removeFromSale(1)
      ).to.be.revertedWith("Only the seller can remove the item from sale");

      // addr1 sells their item to addr2
      const totalPriceInWei = await marketplace.getTotalPrice(1);
      await marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei});

      // addr1 tries to remove item 1 from sale after it has been sold
      await expect(
        marketplace.connect(addr1).removeFromSale(1)
      ).to.be.revertedWith("Item already sold");
    });
  });
})
