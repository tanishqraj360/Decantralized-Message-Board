const hre = require("hardhat");

async function main() {
  const MessageBoard = await hre.ethers.getContractFactory("MessageBoard");

  console.log("Deploying MessageBoard contract...");
  const messageBoard = await MessageBoard.deploy();

  await messageBoard.waitForDeployment();

  console.log("MessageBoard deployed to: ", messageBoard.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
