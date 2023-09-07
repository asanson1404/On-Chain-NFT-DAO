// SPDX-License-Identifier: MIT

//==================================================>
    // Realised by Alexandre Sanson the 07/09/2023
    // Inspired from learnweb3.io
//==================================================>

/*
    Smart contract purpose:

        Smart contract to create a Whitelist of who is authorized to mint an NFT.
        The number of whitelisted addresses is defined during the deployment of the contract (constructor attribute).
        We decided to have 4 whitelisted addresses 


    Whitelist Contract Address: 
    Etherscan.io : 

*/

pragma solidity ^0.8.18;

contract Whitelist {

    // Max number of whitelisted addresses allowed
    uint8 public maxWhitelistedAddresses;
    // Varible to keep track of the number of whitelisted addresses
    uint8 public numAddressesWhitelisted;

    // Mapping to know if an address has been whitelisted or not (default is false) 
    mapping(address => bool) public whitelistedAddresses;

    // Set during the deployment the max number of whitelisted adresses
    constructor(uint8 _maxWhitelistedAddresses) {
        maxWhitelistedAddresses = _maxWhitelistedAddresses;
    }

    /**
     *  This function add the address of the sender to the whitelist
     */
    function addAddressToWhitelist() public {
        require(!whitelistedAddresses[msg.sender], "Sender has already been whitelisted");
        require(numAddressesWhitelisted < maxWhitelistedAddresses, "Max number of whitelisted addresses has been reached. More addresses can't be added");

        // Add the address of the caller to the whitelisted array
        whitelistedAddresses[msg.sender] = true;
        // Increment the number of whitelisted addresses
        numAddressesWhitelisted += 1;
    }


}