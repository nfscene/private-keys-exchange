const Encrypt = artifacts.require("Encrypt");
const Marketplace = artifacts.require("Marketplace");
const Response = artifacts.require("Response");
const Exchange = artifacts.require("Exchange");

module.exports = async function (deployer) {
  deployer.deploy(Encrypt);
  deployer.link(Encrypt, Response);
  deployer.link(Encrypt, Exchange);
  deployer.link(Encrypt, Marketplace);
  deployer.deploy(Marketplace);
};
