const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
const { ethers } = require("ethers");
const xor = require("bitwise-xor");

const testHelper = {
    assertRevert: async (revertPromise) => {
        try {
            await revertPromise;
        } catch (err) {
            assert.include(err.message, "revert", "The error message should contain 'revert'");
            return;
        }
        throw new Error('Revert error not detected.');
    },

    encryptFromKeys: (message, privateKey_, publicKey_) => {
        return testHelper.encrypt(message, testHelper.getSecret(privateKey_, publicKey_));
    },

    getSecret: (privateKey_, publicKey_) => {
        const privateKey = secp256k1.keyFromPrivate(new Uint8Array(web3.utils.hexToBytes(privateKey_)));
        const publicKey = secp256k1.keyFromPublic(`04${publicKey_}`, 'hex');
        return web3.utils.numberToHex(privateKey.derive(publicKey.getPublic()));
    },

    encrypt: (message, key) => {
        const keyBuffer = Buffer.from(web3.utils.hexToBytes(ethers.utils.solidityKeccak256(["bytes32", "string"], [key.toString(), "7"])));
        const messageBuffer = Buffer.from(web3.utils.hexToBytes(message));
        const cipherBuffer = xor(messageBuffer, keyBuffer);
        return '0x' + cipherBuffer.toString('hex');
    }
}

module.exports = testHelper;