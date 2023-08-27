// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract XelaCollectionNFT is ERC721Enumerable {

    // Initialize the ERC-721 contract
    constructor() ERC721("Xela NFT Collection", "XLA") {}

    function mint() public {
        _safeMint(msg.sender, totalSupply());
    }

}
