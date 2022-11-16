pragma solidity ^0.8.0;

import "./Article.sol";
import "./Response.sol";

contract Exchange {
    address public immutable article;
    address payable public immutable buyer;
    uint256 public fees;
    bytes public buyerPublicKey;
    Status public status;
    address public response;

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

    function createResponse(bytes memory _encryptedPrivateKey, bytes memory _signaturePrivateKey) external payable withoutResponse {
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
}
