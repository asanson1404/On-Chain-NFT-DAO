// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

//import the interface
import "../interfaces/IFakeNFTMarketplace.sol";
import "../interfaces/IXelaCollectionNFT.sol";

contract XelaDAO is Ownable {

    // Variable to store the contracts we will call
    IFakeNFTMarketplace nftMarketplace;
    IXelaCollectionNFT  xelaNFT;

    // Struct containing all relevant information of a new proposal of purchase
    struct Proposal {
        uint256 tokenIdToBuy;
        uint256 yesVote;
        uint256 noVote;
        uint256 deadline; // The UNIX timestamp until which this proposal is active. Proposal can be executed after the deadline has been exceeded.
        bool    executed; // Whether or not this proposal has been executed. Cannot be executed before the deadline has been exceeded.
        mapping(uint256 => bool) voters; // Mapping between XelaNFT tokenIDs and booleans to know if the NFT has been used to vote 
    }

    // Mapping of ID to Proposal in order to be able to list the proposals
    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;

    // Payble constructor to accept ether from the deployer (to fill the DAO's treasury)
    // Initializes the contract instances for the SC we will use
    constructor(address _nftMarketplaceAdd, address _xelaNFTAdd) payable {
        nftMarketplace = IFakeNFTMarketplace(_nftMarketplaceAdd);
        xelaNFT        = IXelaCollectionNFT(_xelaNFTAdd);
    } 


}