const Article = artifacts.require("Article");
const Exchange = artifacts.require("Exchange");
const EthCrypto = require('eth-crypto');

contract('Exchange', (accounts) => {
    let article = null;
    let exchange = null;
    let price = 1000;
    let fees = 10;
    const articleIdentity = EthCrypto.createIdentity();
    const buyerIdentity = EthCrypto.createIdentity();
    
    before( async () => {
        article = await Article.new("0x" + articleIdentity.publicKey, price, {from: accounts[0]});
        exchange = await Exchange.new(article.address, fees, web3.utils.fromAscii(buyerIdentity.publicKey), {from: accounts[1], value: 2 * price + fees});
    })

    it('Check create Exchange', async () => {
        assert.equal((await exchange.getStatus.call()).toString(), "0")
        assert.equal(await web3.eth.getBalance(exchange.address), 2 * price + fees)
    })

    it('It sends a response', async () => {
        const message = articleIdentity.privateKey;
        const encryptedKey = await EthCrypto.encryptWithPublicKey(buyerIdentity.publicKey, message);
        const signature = await EthCrypto.sign(articleIdentity.privateKey, EthCrypto.hash.keccak256(message));

        const signatureTrace = await exchange.getSignatureTrace(
            "0x" + encryptedKey.ciphertext,
            signature
        );
        console.log(signatureTrace);
        const articlePubKeyTrace = await exchange.getPubKeyTrace();
        console.log(articlePubKeyTrace);

        /*await exchange.response(
                "0x" + encryptedKey.ciphertext,
                signature
        );*/
    })
})

