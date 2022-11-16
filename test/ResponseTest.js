const Response = artifacts.require("Response");
const Article = artifacts.require("Article");
const EthCrypto = require('eth-crypto');

async function assertRevert(revertPromise) {
    try {
        await revertPromise;
    } catch (err) {
        assert.include(err.message, "revert", "The error message should contain 'revert'");
    }
}

contract('Response', (accounts) => {
    let article = null;
    const articleIdentity = EthCrypto.createIdentity();
    const buyerIdentity = EthCrypto.createIdentity();

    before(async () => {
        article = await Article.new("0x" + articleIdentity.publicKey, 1000, {from: accounts[0]});
        message = (await EthCrypto.encryptWithPublicKey(buyerIdentity.publicKey, articleIdentity.privateKey)).ciphertext;
        signature = EthCrypto.sign(articleIdentity.privateKey, EthCrypto.hash.keccak256(message));
    })

    it('Check signature trace and article publication ', async () => {
        const response = await Response.new(web3.utils.toHex(message), signature, article.address, {from: accounts[2]});

        assert.equal(await response.getProvider(), accounts[2]);
    })
})

