/**
 *  Script to deploy and verify the 4 Smart Contracts of our project.
 *  The deployer choosed to add 0.02 ethers to the DAO's treasury during the deployement.
 *  Also, we automatically bind the Xela NFT Collection to this DAO (same treasury).
 */

const hre = require("hardhat");

// Function to wait in milliseconds
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {

  // Deploy the Whitelist Contract ; we give the argument 4 to the constructor
  const whitelistContract = await hre.ethers.deployContract("Whitelist", [4]);
  await whitelistContract.waitForDeployment();
  const whitelistContractAddr = whitelistContract.target;
  console.log("Whitelist Contract deployed to:", whitelistContractAddr);

  // Deploy the Fake NFT Marketplace Contract
  const fakeNftMarketplaceContract = await hre.ethers.deployContract("FakeNFTMarketplace");
  await fakeNftMarketplaceContract.waitForDeployment();
  const fakeNftMarketplaceContractAddr = fakeNftMarketplaceContract.target;
  console.log("Fake NFT Marketplace Contract deployed to: ", fakeNftMarketplaceContractAddr);

  // Deploy the NFT Contract by giving the address of the Whitelist Contract to the constructor
  const xelaNftContract = await hre.ethers.deployContract("XelaCollectionNFT", [whitelistContractAddr]);
  await xelaNftContract.waitForDeployment();
  const xelaNftContractAddr = xelaNftContract.target;
  console.log("XelaCollectionNFT Contract deployed to: ", xelaNftContractAddr);

  // Deploy the DAO Contract by giving the address of the FakeNFTMarketplace Contract and XelaNFT Constract to the constructor
  const initialPayement = hre.ethers.parseEther("0.02"); // The fund the DAO deployer (DOA's owner) add to the treasury
  const daoContract = await hre.ethers.deployContract("XelaDAO", [fakeNftMarketplaceContractAddr, xelaNftContractAddr], {value: initialPayement});
  await daoContract.waitForDeployment();
  const daoContractAddr = daoContract.target;
  console.log("Xela DAO Contract deployed to: ", daoContractAddr);
  
  // Bind Xela Collection to the DAO Contract
  await xelaNftContract.setDAOaddress(daoContractAddr);

  // Wait 30 seconds to let Etherscan catch up with the deployments
  await sleep(30 * 1000);

  // verify the Whitelist Contract on Etherscan
  await hre.run("verify:verify", {
    address: whitelistContractAddr,
    constructorArguments: [4],
  });

  // verify the Fake NFT Marketplace Contract on Etherscan
  await hre.run("verify:verify", {
    address: fakeNftMarketplaceContractAddr,
  });

  // verify the Xela NFT Contract on Etherscan
  await hre.run("verify:verify", {
    address: xelaNftContractAddr,
    constructorArguments: [whitelistContractAddr],
  });

  // verify the Xela DAO Contract on Etherscan
  await hre.run("verify:verify", {
    address: daoContractAddr,
    constructorArguments: [fakeNftMarketplaceContractAddr, xelaNftContractAddr],
  });

}

// Call the main function and catch if there is any error
main()
      .then(() => process.exit(0))
      .catch((error) => {
          console.error(error);
          process.exit(1);
      });
