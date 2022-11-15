const Article = artifacts.require("Article");
const Exchange = artifacts.require("Exchange");
const Marketplace = artifacts.require("Marketplace");

module.exports = function(deployer) {
  deployer.deploy(Marketplace);
};
