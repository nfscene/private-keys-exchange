pragma solidity ^0.8.0;

import "./Article.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Exchange {
    address public immutable article;
    address payable public immutable buyer;
    bytes public buyerPublicKey;
    address payable public keyProvider;
    uint256 public fees;
    bytes public encryptedPrivateKey;
    bytes public signaturePrivateKey;
    Status public status;

    enum Status {
        ACTIVE,
        INACTIVE,
        VALID,
        REJECTED
    }

    constructor(address _article, uint256 _fees, bytes memory _publicKey) payable {
        require(msg.value == Article(_article).getPrice() * 2 + _fees);
        fees = _fees;
        article = _article;
        buyer = payable(tx.origin);
        buyerPublicKey = _publicKey;
        status = Status.ACTIVE;
    }

    receive() external payable {}

    fallback() external payable {}

    modifier onlyBuyer {
        require(msg.sender == buyer);
        _;
    }

    modifier onlyActive {
        require(status == Status.ACTIVE);
        _;
    }

    modifier withoutResponse {
        require(encryptedPrivateKey.length == 0);
        require(signaturePrivateKey.length == 0);
        require(keyProvider == payable(address(0)));
        _;
    }

    modifier withResponse {
        require(encryptedPrivateKey.length != 0);
        require(signaturePrivateKey.length != 0);
        require(keyProvider != payable(address(0)));
        _;
    }

    function cancel() public onlyBuyer onlyActive withoutResponse {
        buyer.transfer(address(this).balance);
        status = Status.INACTIVE;
    }

    function getStatus() public view returns (Status) {
        return status;
    }

    function getBuyer() public view returns (address payable) {
        return buyer;
    }

    function response(bytes memory _encryptedPrivateKey, bytes memory _signaturePrivateKey) public onlyActive withoutResponse {
        require(verify(_encryptedPrivateKey, _signaturePrivateKey));
        encryptedPrivateKey = _encryptedPrivateKey;
        signaturePrivateKey = _signaturePrivateKey;
        keyProvider = payable(msg.sender);
    }

    function getSignatureTrace(bytes memory _message, bytes memory _signature) public pure returns (address) {
        //return ECDSA.recover(keccak256(_message), _signature);
        return ECDSA.recover(keccak256(_message), _signature);
    }

    function getPubKeyTrace() public view returns (address){
        //return address(bytes20(keccak256(Article(article).getPublicKey())));
        return address(bytes20(Article(article).getPublicKey()));
    }

    function verify(bytes memory _message, bytes memory _signature) public view returns (bool) {
        return getSignatureTrace(_message, _signature) == getPubKeyTrace();
    }

    function validate() public onlyBuyer onlyActive withResponse {
        Article _article = Article(article);
        uint256 _price = _article.getPrice();
        _article.getSeller().transfer(_price);
        buyer.transfer(_price);
        keyProvider.transfer(address(this).balance - 2 * _price);
        status = Status.VALID;
    }
}
