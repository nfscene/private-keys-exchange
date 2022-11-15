const Article = artifacts.require("Article");
const EthCrypto = require('eth-crypto');

async function assertRevert(revertPromise) {
    try {
        await revertPromise;
    } catch (err) {
        assert.include(err.message, "revert", "The error message should contain 'revert'");
    }
}

contract('Article', (accounts) => {
    const articleIdentity = EthCrypto.createIdentity();
    const price = 1000;
    const seller = accounts[0];
    let article = null;
    
    before( async () => {
        article = await Article.new(web3.utils.fromAscii(articleIdentity.publicKey), price, {from: seller});
    })
    
    it('Check article is correctly created', async () => {
        assert.equal(await article.getSeller.call(), seller)
        assert.equal(await article.getPublicKey.call(), web3.utils.fromAscii(articleIdentity.publicKey));
        assert.equal(await article.getPrice.call(), price);
    })

    it('Update article price', async () => {
        const newPrice = 1200
        assertRevert(article.setPrice.call(newPrice, {from: accounts[9]}));
        await article.setPrice.call(newPrice, {from: seller})
        assert.equal(await article.getPrice.call(), price);
    })
})

