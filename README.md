# Decentralized Message Board

This project demonstrates a basic decentralized messaging board using the ethereum network using Metamask.

1. Install Metamask extension on your browser from metamask.io

2. Run the following command in root folder
```shell
npx hardhat node
```
3. Open another terminal window and execute the following
```shell
npx hardhat run scripts/deploy.js --network localhost
```
  This will give the CONTRACT_ADDRESS which should be saved in frontend/src/config.js

4. Run the frontend server
```shell
cd frontend
npm start
```

5. Open Metamask extension and configure localhost server 
    Name: Localhost 8545
    Url: http://127.0.0.1:8545
    Chain: 31337
    Currency: ETH

6. Copy any private key obtained in the terminal from Step 1 and create an account on Metamask using private key.
