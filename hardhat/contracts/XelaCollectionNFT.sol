// SPDX-License-Identifier: MIT

//==================================================>
    // Realised by Alexandre Sanson the 16/09/2023
    // Inspired from learnweb3.io
//==================================================>

/*
    Smart contract purpose:

        Smart contract to create an NFT Collection. Only 14 NFTs are available (price 0.01 ether)
        Possible to be part of a whitelist to mint an NFT for free (4 rooms in the whitelist).
        This collection is bound to a DAO (same owner) which allows NFTs holder to propose the purchase of new NFTs 


    Xela Collection Contract Address: 0xB8492aD52067B0b0a520041c0B16A3092bee05Bc
    https://sepolia.etherscan.io/ : https://sepolia.etherscan.io/address/0xB8492aD52067B0b0a520041c0B16A3092bee05Bc

*/

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Whitelist.sol";

contract XelaCollectionNFT is ERC721Enumerable, Ownable {

    bool public daoAddrBound; // DAO Address not set yet - default is fault
    address public daoAddr;   // Address of the DAO

    // The price of a single NFT
    uint64 constant public _tokenPrice = 0.01 ether;

    // Max number of NFTs from Xela Collection that can ever exist
    uint8 constant public maxTokenIds = 14;

    // Whitelist Contract Instance
    Whitelist whitelistInstance;

    // Number of tokens reserved for whitelisted members
    uint8 public reservedTokens;
    uint8 public reservedTokensClaimed;

    /**
      * We call the constructor of ERC721 contract because ERC721Enumerable inherit ERC721 
      * We also initialise an instance of whitelist interface (with the address of the contract previously deployed)
    */
    constructor(address whitelistContractAddress) ERC721("Xela NFT Collection", "XLA") {
        whitelistInstance = Whitelist(whitelistContractAddress);
        reservedTokens    = whitelistInstance.maxWhitelistedAddresses();
    }

    /**
      * Function callable on by the NFT Contract owner to link his Collection with a DAO
    */
    function setDAOaddress(address _daoAddr) external onlyOwner {
        require(!daoAddrBound, "NFT_COLLECTION_ALREADY_ASSIGNED_TO_A_DAO");
        daoAddr = _daoAddr;
        daoAddrBound = true;
    }

    /**
      * Minting an NFT is possible within the limit of maxTokenIds
      * Minting is possible only when the NFT Contract is bound with a DAO Contract
    */
    function mint() public payable {

        require(daoAddrBound && daoAddr != address(0), "CONTRACT_NOT_AFFILIATED_TO_A_DAO");

        uint8 reservedTokensRemaining = reservedTokens - reservedTokensClaimed;

        // Make sure we always leave enough token for whitelist reservations
        require(totalSupply() + reservedTokensRemaining < maxTokenIds, "EXCEEDED_MAX_SUPPLY");

        // If the caller is part of the whitelist
        if(whitelistInstance.whitelistedAddresses(msg.sender) && msg.value < _tokenPrice) {
            // Make sure this user hasn't already mint his NFT
            require(balanceOf(msg.sender) == 0, "ALREADY_OWNED");
            reservedTokensClaimed += 1;
        }
        else { // The caller is not part of the whitelist
            // Make sure he sent enough ethers
            require(msg.value >= _tokenPrice, "NOT_ENOUGH_ETHERS");
        }

        uint256 tokenId = totalSupply() + 1;
        _safeMint(msg.sender, tokenId);

        // Send the ethers to the DAO treasury
        (bool sent,) = daoAddr.call{value: msg.value}("");
        require(sent, "FAILED_TO_SEND_ETHERS_TO_THE_DAO");

    }

}