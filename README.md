# NFT Marketplace

## Technology Stack & Tools

- Solidity (Writing Smart Contract)
- Javascript (React & Testing)
- [Ethers](https://docs.ethers.io/v5/) (Blockchain Interaction)
- [Hardhat](https://hardhat.org/) (Development/Testing Framework)
- [IPFS](https://ipfs.io/) (Metadata storage)
- [React routers](https://v5.reactrouter.com/) (Navigational components)

## Requirements For Initial Setup

- Install [NodeJS](https://nodejs.org/en/), should work with any node version below 16.5.0
- Install [Hardhat](https://hardhat.org/)

## Setting Up

### 1. Clone/Download the Repository

### 2. Install Dependencies

`npm install`

### 3. Boot up local development blockchain

`npx hardhat node`

### 4. Connect Development Blockchain Accounts to MetaMask

1. **Copy the private key** of the addresses you want to import into MetaMask.
2. **Connect your MetaMask to the Hardhat blockchain** by selecting the network at 127.0.0.1:8545.

#### If you haven't added the Hardhat network to your MetaMask:

1. Open your preferred web browser and click on the MetaMask icon.
2. Click on the top-center dropdown button to display the list of available networks.
3. Click on "Add Network" at the bottom of the list to open the "Add Network" form.
4. Fill in the form with the following details:
   - Network Name: Enter "Hardhat".
   - New RPC URL: Enter "http://127.0.0.1:8545".
   - Chain ID: Enter "31337".
5. Click on the "Save" button to add the Hardhat network to your MetaMask.


### 5. Migrate Smart Contracts

`npx hardhat run src/backend/scripts/deploy.js --network localhost`

### 6. Run Tests

`npx hardhat test`

### 7. Run Server

`node proxy-server.js`

### 8. Launch Frontend

`npm run start`

## Troubleshooting

If you fail to complete a transaction on MetaMask due to a "MetaMask - RPC Error," you may resolve the issue by following these steps: navigate to the MetaMask extension in your browser, **select your account profile -> Settings -> Advanced -> Clear activity tab data**
