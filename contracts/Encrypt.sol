// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EllipticCurve.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

library Encrypt {
    uint256 constant private GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint256 constant private GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    uint256 constant private AA = 0;
    uint256 constant private PP = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    string constant COUNTER_VALUE = "7";

    function getPublicKey(uint256 privateKey) public pure returns (uint256, uint256) {
        return getDeriveKey(privateKey, GX, GY);
    }

    function getSecret(uint256 privateKeyA, bytes memory publicKeyB) public pure returns (uint256) {
        (uint256 gX, uint256 gY) = toUint256(publicKeyB);
        (uint256 pX, ) = getDeriveKey(privateKeyA, gX, gY);
        return pX;
    }

    function getDeriveKey(uint256 privateKey, uint256 gX, uint256 gY) public pure returns (uint256, uint256) {
        return EllipticCurve.ecMul(
            privateKey,
            gX,
            gY,
            AA,
            PP
        );
    }

// Implementation of the keccak256 symetric encryption
// https://billatnapier.medium.com/how-do-i-implement-symmetric-key-encryption-in-ethereum-14afffff6e42
    function symmetricEncryption(uint256 message, uint256 key) public pure returns (uint256) {
        uint256 hash = uint256(keccak256(abi.encodePacked(key, COUNTER_VALUE)));
        return message ^ hash;
    }

    function verifySignature(uint256 message, bytes memory signature, bytes memory pubKey) public pure returns (bool) {
        return getSignatureTrace(message, signature) == getPubKeyTrace(pubKey);
    }

    function getSignatureTrace(uint256 message, bytes memory signature) public pure returns (address) {
        return ECDSA.recover(bytes32(toBytes(message)), signature);
    }

    function getPubKeyTrace(bytes memory pubKey) public pure returns (address trace) {
        bytes32 hash = keccak256(pubKey);
        assembly {
            mstore(0, hash)
            trace := mload(0)
        }
    }

    function bytesToBytes32(bytes memory b, uint offset) private pure returns (bytes32) {
        bytes32 out;

        for (uint i = 0; i < 32; i++) {
            out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    function toBytes(uint256 x) private pure returns (bytes memory b) {
        b = new bytes(32);
        assembly { mstore(add(b, 32), x) }
    }

    function toUint256(bytes memory publicKeyB) public pure returns (uint256, uint256) {
        uint256 x = uint256(bytesToBytes32(publicKeyB, 0));
        uint256 y = uint256(bytesToBytes32(publicKeyB, 32));
        return (x, y);
    }
}
