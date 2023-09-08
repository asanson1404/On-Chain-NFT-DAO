// SPDX-License-Identifier: MIT

//==================================================>
    // Realised by Alexandre Sanson the 07/09/2023
    // Inspired from learnweb3.io
//==================================================>

/*
    Smart contract purpose:

        Smart contract to manage the DAO. 
        From the ethers that was gained through the sale of NFTs, the DAO members (NFTs holders) can create and vote on 
        proposals to use that ETH for purchasing other NFTs from an NFT marketplace, and speculate on price.
        
        DAO rules:
        1 - Anyone who owns a Xela NFT can create a proposal to purchase a different NFT from an NFT marketplace
        2 - Everyone with a Xela NFT can vote for or against the active proposals
        3 - Each NFT counts as one vote for each proposal
        4 - Voters cannot vote multiple times on the same proposal with the same NFT
        5 - If majority of the voters vote in favor of the proposal by the deadline, the NFT purchase 
            happens automatically from the marketplace


    Xela DAO Contract Address: 0x4d67959Ffbaafd79DE45fF73147147185d626bf7
    Etherscan.io : https://goerli.etherscan.io/address/0x4d67959Ffbaafd79DE45fF73147147185d626bf7

*/

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

//import the interface
import "../interfaces/IFakeNFTMarketplace.sol";
import "../interfaces/IXelaCollectionNFT.sol";

contract XelaDAO is Ownable {

    // Allow the contract to accept ETH deposits directly (without calling a payable function)
    receive() external payable {}
    fallback() external payable {}

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

    // Modifer to check if the proposal deadline has been exceeded
    // and hasn't been executed yet 
    modifier closedProposalOnly(uint256 proposalIndex) {
        require(block.timestamp >= proposals[proposalIndex].deadline, "PROPOSAL_NOT_EXPIRED");
        require(proposals[proposalIndex].executed == false, "PROPOSAL_ALREADY_EXECUTED");
        _;
    }

    // Get the DAO Contract's balance
    function getContractBalance() public view returns(uint256) {
        return address(this).balance;
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

    /// @dev executeProposal() allow any DAO member to execute the proposal, namely purchase the NFT if there's a majority of yes
    /// @param proposalIndex - The index of the proposal to execute
    function executeProposal(uint256 proposalIndex) external daoMemberOnly closedProposalOnly(proposalIndex) {

        Proposal storage proposal = proposals[proposalIndex];

        require(proposal.yesVote != proposal.noVote, "AS_MANY_YESES_AS_NOES_NEED_TO_FIND_A_CONSENSUS");
        require(proposal.yesVote > proposal.noVote, "COULD_NOT_PURCHASE_THE_NFT_BECAUSE_THE_COMMUNITY_HAS_VOTED_NO");

        uint256 nftPrice = nftMarketplace.getPrice();
        require(address(this).balance >= nftPrice, "NOT_ENOUGH_FUND_IN_THE_SMART_CONTRACT");
        nftMarketplace.purchase{value: nftPrice}(proposal.tokenIdToBuy);

        proposal.executed = true;
    }

    /// @dev withdrawEther() allows the contract owner (deployer) to withdraw the ETH from the contract
    function withdrawEthers() external onlyOwner {
        uint256 ethersAmount = address(this).balance;
        require(ethersAmount > 0, "NOTHING_TO_WITHDRAW_CONTRACT_BALANCE_EMPTY");
        (bool sent,) = payable(owner()).call{value: ethersAmount}("");
        require(sent, "FAILED_TO_WITHDRAW_ETHERS");
    }

}