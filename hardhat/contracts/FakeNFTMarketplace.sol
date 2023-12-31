// SPDX-License-Identifier: MIT

//==================================================>
    // Realised by Alexandre Sanson the 16/09/2023
    // Inspired from learnweb3.io
//==================================================>

/*
    Smart contract purpose:

        Smart contract which simulate an NFT Marketplace.
        It's possible to call classical function such as purchase, getPrice and available.
        The user can invent the token id ;)

    Fake NFT Marketplace Contract Address: 0x6b70ECA73689463C863873154744169Bcc622308
    https://sepolia.etherscan.io/ : https://sepolia.etherscan.io/address/0x6b70ECA73689463C863873154744169Bcc622308

*/

pragma solidity ^0.8.18;

contract FakeNFTMarketplace {

    /// Keep tracks of which fake token ID belong to which address
    mapping(uint256 => address) public tokensAssociation;


    /// Set the purchase price of the fake NFTs
    uint256 nftPrice = 0.01 ether;

    /// Function to buy an NFT. This function update the token association tab at every new purchase.
    /// @param _tokenId - The fake NFT to purchase
    function purchase(uint256 _tokenId) external payable {
        require(msg.value == nftPrice, "Not enough ethers to buy the NFT (it costs 0.1 ether)");
        tokensAssociation[_tokenId] = msg.sender;
    }

    /// Function which returns the price of one NFT
    function getPrice() external view returns (uint256) {
        return nftPrice;
    }

    /// Function which check if a specified token has already been sold or not
    /// @param _tokenId - the token to check for
    function available(uint256 _tokenId) external view returns (bool) {
        // address(0) = 0x0000000000000000000000000000000000000000
        // This is the default value for addresses in Solidity
        if(tokensAssociation[_tokenId] == address(0)) {
            return true;
        }
        return false;
    }
    
}