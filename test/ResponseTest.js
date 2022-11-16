const Response = artifacts.require("Response");
const Article = artifacts.require("Article");
const TestHelper = require('./TestHelper');
const EthCrypto = require('eth-crypto');

contract('Response', (accounts) => {
    let article = null;
    let message = null;
    let signature = null;
    const articleIdentity = EthCrypto.createIdentity();
    const providerIdentity = EthCrypto.createIdentity();
    const buyerIdentity = EthCrypto.createIdentity();

    before(async () => {
        article = await Article.new("0x" + articleIdentity.publicKey, 1000, {from: accounts[0]});
        message = TestHelper.encryptFromKeys(articleIdentity.privateKey, articleIdentity.privateKey, buyerIdentity.publicKey)
        signature = EthCrypto.sign(articleIdentity.privateKey, message);
    })

    it('Check signature trace and article publication ', async () => {
        const response = await Response.new(message, signature, article.address, {from: accounts[2]});
        assert.equal(await response.getProvider.call(), accounts[2]);
    })
})

