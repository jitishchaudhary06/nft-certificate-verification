// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CertificateNFT
 * @notice ERC-721 NFT certificates for academic credentials on Polygon Amoy
 */
contract CertificateNFT is ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    Counters.Counter private _tokenIdCounter;

    struct CertificateData {
        string studentName;
        string university;
        string course;
        string grade;
        string certificateNumber;
        uint256 issuedAt;
        bool revoked;
        address issuer;
    }

    mapping(uint256 => CertificateData) private _certificates;
    mapping(string => uint256) private _certificateNumberToTokenId;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed to,
        string certificateNumber,
        string studentName
    );

    event CertificateRevoked(uint256 indexed tokenId, string reason);

    constructor(address admin) ERC721("NFT Academic Certificate", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(REVOKER_ROLE, admin);
    }

    function mintCertificate(
        address to,
        string memory tokenURI_,
        string memory studentName,
        string memory university,
        string memory course,
        string memory grade,
        string memory certificateNumber
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(bytes(certificateNumber).length > 0, "Certificate number required");
        require(_certificateNumberToTokenId[certificateNumber] == 0, "Certificate already minted");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        _certificates[tokenId] = CertificateData({
            studentName: studentName,
            university: university,
            course: course,
            grade: grade,
            certificateNumber: certificateNumber,
            issuedAt: block.timestamp,
            revoked: false,
            issuer: msg.sender
        });

        _certificateNumberToTokenId[certificateNumber] = tokenId;

        emit CertificateMinted(tokenId, to, certificateNumber, studentName);
        return tokenId;
    }

    function verifyCertificate(
        uint256 tokenId
    ) external view returns (bool isValid, CertificateData memory cert) {
        require(_exists(tokenId), "Token does not exist");
        cert = _certificates[tokenId];
        isValid = !cert.revoked;
    }

    function revokeCertificate(
        uint256 tokenId,
        string memory reason
    ) external onlyRole(REVOKER_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        require(!_certificates[tokenId].revoked, "Already revoked");

        _certificates[tokenId].revoked = true;
        emit CertificateRevoked(tokenId, reason);
    }

    function getCertificate(uint256 tokenId) external view returns (CertificateData memory) {
        require(_exists(tokenId), "Token does not exist");
        return _certificates[tokenId];
    }

    function getTokenIdByCertificateNumber(
        string memory certificateNumber
    ) external view returns (uint256) {
        uint256 tokenId = _certificateNumberToTokenId[certificateNumber];
        require(tokenId != 0, "Certificate not found");
        return tokenId;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
