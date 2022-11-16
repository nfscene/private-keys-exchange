pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./Article.sol";

//TODO: https://gitlab.com/nfscene/nfsblock/-/issues/1
contract Response {
    bytes public encryptedPrivateKey;
    bytes public signaturePrivateKey;
    address payable public immutable provider;

    constructor(bytes memory _encryptedPrivateKey, bytes memory _signaturePrivateKey, address _article) public payable {
        require(verify(_encryptedPrivateKey, _signaturePrivateKey, _article));
        encryptedPrivateKey = _encryptedPrivateKey;
        signaturePrivateKey = _signaturePrivateKey;
        provider = payable(tx.origin);
    }

    function verify(bytes memory _message, bytes memory _signature, address _article) private view returns (bool) {
        return getSignatureTrace(keccak256(_message), _signature) == getPubKeyTrace(_article);
    }

    function getSignatureTrace(bytes32 _message, bytes memory _signature) private pure returns (address) {
        return ECDSA.recover(_message, _signature);
    }

    function getPubKeyTrace(address _article) private view returns (address trace) {
        bytes32 hash = keccak256(Article(_article).getPublicKey());
        assembly {
            mstore(0, hash)
            trace := mload(0)
        }
    }

    function getProvider() public view returns (address payable) {
        return provider;
    }
}
