// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Minimal interface for the XelaCollectionNFT contract containing 
   only 2 functions that we are interested in
 */
interface IXelaCollectionNFT {

    /// @dev Returns the number of tokens in ``owner``'s account.
    function balanceOf(address owner) external view returns (uint256 balance);

    /// @dev Returns a token ID owned by `owner` at a given `index` of its token list.
    /// Use along with {balanceOf} to enumerate all of ``owner``'s tokens.
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);

}