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

    // Enum containing the only possible options for voting
    enum Vote {
        YES,
        NO
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

    // Modifier to only let the XelaNFTs owner call certain functions
    modifier daoMemberOnly() {
        require(xelaNFT.balanceOf(msg.sender) > 0, "NOT_A_DAO_MEMBER");
        _;
    }

    // Modifier to check if the proposal deadline hasn't exceeded
    modifier openProposalOnly(uint256 proposalIndex) {
        require(block.timestamp < proposals[proposalIndex].deadline, "PROPOSAL_EXPIRED");
        _;
    }

    /// @dev createProposal() allows dao member to submit a proposal to buy a new NFT with the treasury
    /// @param _tokenIdToBuy - The ID of the NFT to proposer would like to buy
    /// @return Returns the ID of the newly created proposal 
    function createProposal(uint256 _tokenIdToBuy) external daoMemberOnly returns(uint256) {

        require(nftMarketplace.available(_tokenIdToBuy), "THIS_NFT_ALREADY_HAS_OWNER");

        Proposal storage proposal = proposals[numProposals];
        proposal.tokenIdToBuy = _tokenIdToBuy;
        // Proposol voting deadline is (current time + 5 minutes)
        proposal.deadline     = block.timestamp + 5 minutes;

        numProposals++;

        return numProposals - 1;
    }

    /// @dev voteOnProposal() take a DAO member's vote on a proposal into account
    /// @param proposalIndex - The index of the proposal to vote on
    /// @param vote - The type of the vote they want to cast
    function voteOnProposal(uint256 proposalIndex, Vote vote) external daoMemberOnly openProposalOnly(proposalIndex) {

        Proposal storage proposal = proposals[proposalIndex];
        uint256 voterNFTBalance = xelaNFT.balanceOf(msg.sender);
        uint256 numVotes = 0;

        // Calculate how many NFTs owned by the voter haven't been used for voting on this proposal
        for(uint256 i = 0; i < voterNFTBalance; i++) {
            uint256 tokenIdUsed = xelaNFT.tokenOfOwnerByIndex(msg.sender, i);
            if(proposal.voters[tokenIdUsed] == false) {
                proposal.voters[tokenIdUsed] = true;
                numVotes++;
            }
        }

        require(numVotes > 0, "HAS_ALREADY_VOTED");
        if (vote == Vote.NO) {
            proposal.noVote += numVotes;
        }
        else {
            proposal.yesVote += numVotes;
        }
    }

}