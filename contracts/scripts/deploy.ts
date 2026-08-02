import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CertificateNFT with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const contract = await CertificateNFT.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CertificateNFT deployed to:", address);
  console.log("Set CERTIFICATE_NFT_ADDRESS=" + address + " in your .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
