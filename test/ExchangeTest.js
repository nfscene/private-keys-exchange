const Article = artifacts.require("Article");
const Exchange = artifacts.require("Exchange");
const EthCrypto = require('eth-crypto');
const TestHelper = require('./TestHelper');
const BN = web3.utils.BN;

contract('Exchange', (accounts) => {
    let article = null;
    let exchange = null;
    const price = new BN("100000000000000000");
    const fees = new BN("10000000000000000");
    const TWO = new BN("2");
    const articleIdentity = EthCrypto.createIdentity();
    const buyerIdentity = EthCrypto.createIdentity();
    const providerIdentity = EthCrypto.createIdentity();
    const publisher = accounts[0]
    const buyer = accounts[2]
    const provider = accounts[1]
    let message;
    let signature;

    before(async () => {
        article = await Article.new("0x" + articleIdentity.publicKey, price, {from: publisher});
        message = TestHelper.encryptFromKeys(articleIdentity.privateKey, articleIdentity.privateKey, buyerIdentity.publicKey);
        signature = EthCrypto.sign(articleIdentity.privateKey, message);
    })

    it('Check create Exchange', async () => {
        exchange = await Exchange.new(
            article.address,
            fees,
            `0x${buyerIdentity.publicKey}`,
            { from: buyer, value: price.mul(TWO).add(fees) }
        );

        const exchangeStatus = (await exchange.getStatus.call()).toString();
        assert.equal(exchangeStatus, "0")

        const exchangeBalance = await web3.eth.getBalance(exchange.address)
        assert.equal(exchangeBalance.toString(), price.mul(TWO).add(fees).toString())
    })

    it('Validate response', async () => {
        //Assert that it needs a response.
        await TestHelper.assertRevert(exchange.validate.call({from: buyer}));

        const cypher = TestHelper.encryptFromKeys(articleIdentity.privateKey, providerIdentity.privateKey, buyerIdentity.publicKey);
        signature = EthCrypto.sign(articleIdentity.privateKey, cypher);
        await exchange.createResponse(cypher, signature, {from: provider});

        //Assert that it needs to be the buyer
        await TestHelper.assertRevert(exchange.validate.call({from: provider}));

        const publisherBalanceBefore = await web3.eth.getBalance(publisher);
        const buyerBalanceBefore = await web3.eth.getBalance(buyer);
        const providerBalanceBefore = await web3.eth.getBalance(provider);

        //Assert validation
        const response = await exchange.getResponse.call();
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

    it('Check dismiss exchange', async () => {
        exchange = await Exchange.new(
            article.address,
            fees,
            `0x${buyerIdentity.publicKey}`,
            { from: buyer, value: price.mul(TWO).add(fees) }
        );
        const wrongIdentity = EthCrypto.createIdentity()
        const wrongKey = wrongIdentity.privateKey;
        const cypher = TestHelper.encryptFromKeys(wrongKey, articleIdentity.privateKey, buyerIdentity.publicKey);
        signature = EthCrypto.sign(articleIdentity.privateKey, cypher);
        await exchange.createResponse(cypher, signature, {from: provider});

        const publisherBalanceBefore = await web3.eth.getBalance(publisher);
        const buyerBalanceBefore = await web3.eth.getBalance(buyer);
        const providerBalanceBefore = await web3.eth.getBalance(provider);

        //Check it sends the good buyer private key
        TestHelper.assertRevert(exchange.dismiss(wrongIdentity.privateKey, {from: buyer}))
        // Actually sends the good one
        await exchange.dismiss(buyerIdentity.privateKey, {from: buyer});
        assert.equal((await exchange.getStatus.call()).toString(), "3");

        //Buyer get refund
        const buyerBalance = await web3.eth.getBalance(buyer);
        assert.equal(buyerBalance > buyerBalanceBefore, true);

        //Publisher doesn't gain money
        const publisherBalance = await web3.eth.getBalance(publisher);
        assert.equal(publisherBalance, publisherBalanceBefore)

        //Provider doesn't get back his money
        const providerBalance = await web3.eth.getBalance(provider);
        assert.equal(providerBalance, providerBalanceBefore)

    })
})

