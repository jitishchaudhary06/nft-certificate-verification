import { expect } from "chai";
import { ethers } from "hardhat";

describe("CertificateNFT", function () {
  async function deployFixture() {
    const [admin, student, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateNFT");
    const contract = await Factory.deploy(admin.address);
    await contract.waitForDeployment();
    return { contract, admin, student, other };
  }

  it("mints a certificate NFT", async function () {
    const { contract, student } = await deployFixture();
    const tx = await contract.mintCertificate(
      student.address,
      "ipfs://QmTestMetadata",
      "Alice Johnson",
      "Demo University",
      "Computer Science",
      "A+",
      "CERT-2026-TEST01"
    );
    await tx.wait();

    expect(await contract.ownerOf(1)).to.equal(student.address);
    expect(await contract.tokenURI(1)).to.equal("ipfs://QmTestMetadata");

    const cert = await contract.getCertificate(1);
    expect(cert.studentName).to.equal("Alice Johnson");
    expect(cert.revoked).to.equal(false);
  });

  it("verifies a valid certificate", async function () {
    const { contract, student } = await deployFixture();
    await contract.mintCertificate(
      student.address,
      "ipfs://QmTest",
      "Bob Smith",
      "Demo University",
      "Mathematics",
      "B",
      "CERT-2026-TEST02"
    );

    const [isValid, cert] = await contract.verifyCertificate(1);
    expect(isValid).to.equal(true);
    expect(cert.course).to.equal("Mathematics");
  });

  it("revokes a certificate", async function () {
    const { contract, student } = await deployFixture();
    await contract.mintCertificate(
      student.address,
      "ipfs://QmTest",
      "Carol",
      "Demo University",
      "Physics",
      "A",
      "CERT-2026-TEST03"
    );

    await expect(contract.revokeCertificate(1, "Academic misconduct"))
      .to.emit(contract, "CertificateRevoked")
      .withArgs(1, "Academic misconduct");

    const [isValid] = await contract.verifyCertificate(1);
    expect(isValid).to.equal(false);
  });

  it("prevents duplicate certificate numbers", async function () {
    const { contract, student, other } = await deployFixture();
    await contract.mintCertificate(
      student.address,
      "ipfs://Qm1",
      "Dave",
      "Demo University",
      "Chemistry",
      "A",
      "CERT-DUP"
    );

    await expect(
      contract.mintCertificate(
        other.address,
        "ipfs://Qm2",
        "Eve",
        "Demo University",
        "Chemistry",
        "A",
        "CERT-DUP"
      )
    ).to.be.revertedWith("Certificate already minted");
  });

  it("rejects mint from non-minter", async function () {
    const { contract, student, other } = await deployFixture();
    await expect(
      contract
        .connect(other)
        .mintCertificate(
          student.address,
          "ipfs://QmX",
          "Frank",
          "Demo University",
          "Biology",
          "C",
          "CERT-X"
        )
    ).to.be.reverted;
  });
});
