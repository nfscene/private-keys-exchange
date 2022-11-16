const Encrypt = artifacts.require("Encrypt");

const EthCrypto = require("eth-crypto");
const TestHelper = require('./TestHelper');

contract('Encrypt', (accounts) => {
    let l = null;
    const identity1 = EthCrypto.createIdentity();
    const identity2 = EthCrypto.createIdentity();

    before(async () => {
       l = await Encrypt.deployed();
    })

    it('Validate derive', async () => {
        const P = identity2.publicKey; const Px = "0x" + P.slice(0, 64); const Py =  "0x" + P.slice(64, 128);
        const R1 = await l.getDeriveKey.call(identity1.privateKey, Px, Py);
        const R1x = web3.utils.numberToHex(R1[0]);
        const secret = web3.utils.numberToHex(TestHelper.getSecret(identity1.privateKey, identity2.publicKey));
        assert.equal(R1x, secret);
    })

    it('Proof of ECCR: R = e x d x G', async () => {
        // Help to understand: https://www.youtube.com/watch?v=yDXiDOJgxmg
        // We want to proof that => R = e x d x G
        // Q = e X G
        const e = identity1.privateKey;
        const Q = identity1.publicKey;
        // P = d X G
        const d = identity2.privateKey;
        const P = identity2.publicKey;

        // R1 = e X P
        const Px = "0x" + P.slice(0, 64); const Py =  "0x" + P.slice(64, 128);
        const R1 = await l.getDeriveKey.call(e, Px, Py);
        const R1X = web3.utils.numberToHex(R1[0]);
        // R2 = d x Q
        const Qx =  "0x" + Q.slice(0, 64); const Qy =  "0x" + Q.slice(64, 128);
        const R2 = await l.getDeriveKey.call(d, Qx, Qy);
        const R2X = web3.utils.numberToHex(R2[0]);

        assert.equal(R1X, R2X);
    })

    it('Proof symetric encryption with Keccak-256 and XOR.', async () => {
        // Implementation of: https://billatnapier.medium.com/how-do-i-implement-symmetric-key-encryption-in-ethereum-14afffff6e42

        //with
        const key = identity1.privateKey;
        const message = identity2.privateKey;

        //Encode
        const lCipher = web3.utils.numberToHex(await l.symmetricEncryption.call(message, key));
        const cipher = TestHelper.encrypt(message, key);
        assert.equal(cipher, lCipher);

        //Decode
        const decoded = web3.utils.numberToHex(await l.symmetricEncryption.call(cipher, key));
        assert.equal(decoded, message);
    })

    it('Validate signature', async () => {
        const cipher = EthCrypto.createIdentity().privateKey;
        const signature = EthCrypto.sign(identity1.privateKey, cipher);
        const response = await l.verifySignature.call(cipher, signature, `0x${identity1.publicKey}`);
        assert.equal(response, true);
    })
})