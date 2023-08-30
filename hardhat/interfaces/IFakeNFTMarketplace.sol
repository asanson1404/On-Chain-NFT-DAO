// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Interface for the FakeNFTMarketplace contract
 */
interface IFakeNFTMarketplace {

    /// @dev purchase() Function to buy an NFT on the marketplace. This function update the token association tab at every new purchase.
    /// @param _tokenId - The fake NFT to purchase
    function purchase(uint256 _tokenId) external payable;

    /// @dev getPrice() Function which returns the price of one NFT from the marketplace
    /// @return price Returns the price in wei for an NFT 
    function getPrice() external view returns (uint256);

    /// @dev available() Function which check if a specified token has already been sold or not
    /// @param _tokenId - the token to check for
    /// @return Returns a boolean value - true if available, false if not
    function available(uint256 _tokenId) external view returns (bool);

}