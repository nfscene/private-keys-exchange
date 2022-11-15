pragma solidity ^0.8.0;


import "./Exchange.sol";

contract Marketplace {
    //Exchange should be a struct or keep it as a contract ?
    mapping(bytes32 => Exchange) public exchanges;
    bytes32[] private _exchangeIds;

    function requestBuyKey(address article, uint256 fees, bytes memory buyerPubKey) public {
        bytes32 _exchangeId = keccak256(abi.encodePacked(article, msg.sender));
        _exchangeIds.push(_exchangeId);
        exchanges[_exchangeId] = new Exchange(article, fees, buyerPubKey);
    }

    function getAllExchanges() public view returns (Exchange[] memory) {
        Exchange[] memory _exchanges = new Exchange[](_exchangeIds.length);
        for (uint i = 0; i < _exchangeIds.length; i++) {
            _exchanges[i] = exchanges[_exchangeIds[i]];
        }
        return _exchanges;
    }


}
