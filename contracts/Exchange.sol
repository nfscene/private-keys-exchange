// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Article.sol";
import "./Response.sol";
import "./Encrypt.sol";

contract Exchange {
    address public immutable article;
    address payable public immutable buyer;
    uint256 public fees;
    bytes public buyerPublicKey;
    Status public status;
    address response;

    enum Status {
        ACTIVE,
        INACTIVE,
        VALID,
        REJECTED
    }

    constructor(address _article, uint256 _fees, bytes memory _publicKey) payable {
        require(msg.value == Article(_article).getPrice() * 2 + _fees);
        article = _article;
        buyer = payable(tx.origin);
        fees = _fees;
        buyerPublicKey = _publicKey;
        status = Status.ACTIVE;
        response = address(0);
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
        require(response == address(0));
        _;
    }

    modifier withResponse {
        require(response != address(0));
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

    function createResponse(uint256 _encryptedPrivateKey, bytes memory _signaturePrivateKey) public withoutResponse {
        response = address(new Response(_encryptedPrivateKey, _signaturePrivateKey, article));
    }

    function getResponse() public view returns (address) {
        return response;
    }

    function validate() public onlyBuyer onlyActive withResponse {
        Article _article = Article(article);
        uint256 _price = _article.getPrice();
        _article.getSeller().transfer(_price);

        Response _response = Response(response);
        _response.getProvider().transfer(fees);

        buyer.transfer(address(this).balance);
        status = Status.VALID;
    }

    function dismiss(uint256 privateBuyerKey) public onlyBuyer onlyActive withResponse {
        // Check that the given private buyer key is the true one.
        (uint256 rbX, uint256 rbY) = Encrypt.getPublicKey(privateBuyerKey);
        (uint256 bX, uint256 bY) = Encrypt.toUint256(buyerPublicKey);
        require((rbX == bX) && (rbY == bY));
        // Decrypt message to check the sent private article key.
        uint256 secretKey = Encrypt.getSecret(privateBuyerKey, Article(article).getPublicKey());
        uint256 wrongArticleKey = Encrypt.symmetricEncryption(Response(response).getEncryptedPrivateKey(), secretKey);
        (uint256 waX, uint256 waY) = Encrypt.getPublicKey(wrongArticleKey);
        (uint256 aX, uint256 aY) = Encrypt.toUint256(Article(article).getPublicKey());
        require((waX != aX) || (waY != aY));
        // Refund money and reject.
        buyer.transfer(address(this).balance);
        status = Status.REJECTED;
    }
}
