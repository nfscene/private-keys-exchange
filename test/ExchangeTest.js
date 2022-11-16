const Article = artifacts.require("Article");
const Exchange = artifacts.require("Exchange");
const EthCrypto = require('eth-crypto');
const BN = web3.utils.BN;

async function assertRevert(revertPromise) {
    try {
        await revertPromise;
    } catch (err) {
        assert.include(err.message, "revert", "The error message should contain 'revert'");
    }
}

contract('Exchange', (accounts) => {
    let article = null;
    let exchange = null;
    const price = 10000;
    const fees = 100;
    const articleIdentity = EthCrypto.createIdentity();
    const buyerIdentity = EthCrypto.createIdentity();
    const publisher = accounts[0]
    const buyer = accounts[2]
    const provider = accounts[1]
    let message;
    let signature;

    before(async () => {
        article = await Article.new("0x" + articleIdentity.publicKey, price, {from: publisher});
        exchange = await Exchange.new(article.address, fees, web3.utils.fromAscii(buyerIdentity.publicKey), {
            from: buyer,
            value: 2 * price + fees
        });
        message = (await EthCrypto.encryptWithPublicKey(buyerIdentity.publicKey, articleIdentity.privateKey)).ciphertext;
        signature = EthCrypto.sign(articleIdentity.privateKey, EthCrypto.hash.keccak256(message));
    })

    it('Check create Exchange', async () => {
        assert.equal((await exchange.getStatus.call()).toString(), "0")
        assert.equal(await web3.eth.getBalance(exchange.address), 2 * price + fees)
    })

    it('Verify setResponse request', async () => {
        //Assert that it needs a response.
        assertRevert(exchange.validate({from: buyer}));
        await exchange.createResponse(web3.utils.toHex(message), signature, {from: provider});

        //Assert that it needs to be the buyer
        assertRevert(exchange.validate({from: provider}));

        const publisherBalanceBefore = await web3.eth.getBalance(publisher);
        const buyerBalanceBefore = await web3.eth.getBalance(buyer);
        const providerBalanceBefore = await web3.eth.getBalance(provider);

        //Assert validation
        const gasEstimate = await exchange.validate.estimateGas({from: buyer});
        await exchange.validate({from: buyer});

        //Check if publisher got his money
        const publisherBalanceAfter = await web3.eth.getBalance(publisher);
        assert.equal(BN(publisherBalanceAfter).toString(), BN(publisherBalanceBefore).add(BN(price)).toString());

        //Check if provider got his money
        const providerBalanceAfter = await web3.eth.getBalance(provider);
        assert.equal(BN(providerBalanceAfter).toString(), BN(providerBalanceBefore).add(BN(fees)).toString());

        //Check if buyer got his money
        //TODO: https://gitlab.com/nfscene/nfsblock/-/issues/2
        /*const buyerBalanceAfter = await web3.eth.getBalance(buyer);
        assert.equal(
            BN(buyerBalanceAfter).add(BN(gasEstimate)).gt(BN(buyerBalanceBefore)), true
        );*/
    })
})

