const { assert } = require("chai")
const { getNamedAccounts, network, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

/**
 * @notice These are the unit tests for the BasicNFT contract.
 * @dev The initial describe() checks to see which blockchain we're on,
 * @dev and sets up the contract and accounts for testing
 */

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT Unit Tests", function () {
          let basicNFT, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["basicnft"])
              basicNFT = await ethers.getContract("BasicNFT", deployer)
          })

          /**
           * @dev Tests constructor and contract initialization.
           */

          describe("constructor", function () {
              it("Initializes the contract correctly", async function () {
                  const tokenCount = await basicNFT.getTokenCounter()

                  assert.equal(tokenCount.toString(), "0")
              })
          })

          /**
           * @dev Tests mintNFT() functionality.
           */

          describe("mintNFT", function () {
              it("Lets the user mint an NFT and updates accordingly", async function () {
                  console.log("Minting NFT...")
                  const txResponse = await basicNFT.mintNFT()
                  await txResponse.wait(1)
                  const tokenURI = await basicNFT.tokenURI(0)
                  const tokenCount = await basicNFT.getTokenCounter()

                  assert.equal(tokenCount.toString(), "1")
                  assert.equal(tokenURI, await basicNFT.TOKEN_URI())
              })
          })
      })
