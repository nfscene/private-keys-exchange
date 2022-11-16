// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Article.sol";
import "./Encrypt.sol";

//TODO: https://gitlab.com/nfscene/nfsblock/-/issues/1
contract Response {
    uint256 public encryptedPrivateKey;
    bytes public signaturePrivateKey;
    address payable public immutable provider;

    constructor(uint256 _encryptedPrivateKey, bytes memory _signaturePrivateKey, address _article) payable {
        require(Encrypt.verifySignature(_encryptedPrivateKey, _signaturePrivateKey, Article(_article).getPublicKey()));
        encryptedPrivateKey = _encryptedPrivateKey;
        signaturePrivateKey = _signaturePrivateKey;
        provider = payable(tx.origin);
    }

    function getProvider() public view returns (address payable) {
        return provider;
    }

    function getEncryptedPrivateKey() public view returns (uint256) {
        return encryptedPrivateKey;
    }
}
