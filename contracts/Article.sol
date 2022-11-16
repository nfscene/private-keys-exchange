// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Article {
    bytes publicKey;
    address payable immutable seller;
    uint256 price;

    constructor(bytes memory _publicKey, uint256 _price) {
        publicKey = _publicKey;
        price = _price;
        seller = payable(tx.origin);
    }

    modifier onlySeller() {
        require(tx.origin == seller);
        _;
    }

    function setPrice(uint256 _price) public onlySeller {
        price = _price;
    }

    function getPrice() public view returns (uint256) {
        return price;
    }

    function getSeller() public view returns (address payable) {
        return seller;
    }

    function getPublicKey() public view returns (bytes memory) {
        return publicKey;
    }
}
