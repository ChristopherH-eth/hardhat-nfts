const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { getNamedAccounts, ethers, network, deployments, waffle } = require("hardhat")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNFT", function () {
          let deployer, randomIpfsNFT, vrfCoordinatorV2Mock, chainId, mintFee
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["randomipfs"])
              randomIpfsNFT = await ethers.getContract("RandomIpfsNFT", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              chainId = network.config.chainId
              mintFee = networkConfig[chainId].mintFee
          })

          /**
           * @dev Tests constructor functionality.
           */

          describe("constructor", function () {
              it("Initializes the contract", async function () {
                  const _mintFee = await randomIpfsNFT.getMintFee()
                  assert.equal(_mintFee.toString(), mintFee.toString())
              })
          })

          /**
           * @dev Tests requestNFT() functionality.
           */

          describe("requestNFT", function () {
              it("Allows the user to request an NFT and emits request", async function () {
                  await expect(randomIpfsNFT.requestNFT({ value: mintFee })).to.emit(
                      randomIpfsNFT,
                      "NftRequested"
                  )
              })

              // Come back to this
              it("Returns a requestId", async function () {
                  const transaction = await randomIpfsNFT.requestNFT({ value: mintFee })
                  const transactionResponse = await transaction.wait(1)
                  const requestId = transactionResponse.events[1].args.requestId.toString()
                  console.log(requestId)
                  assert.notEqual(requestId, "undefined")
              })

              it("Reverts when mintFee is insufficient", async function () {
                  await expect(randomIpfsNFT.requestNFT({ value: 0 })).to.be.revertedWith(
                      "RandomIpfsNFT__NeedMoreETHSent"
                  )
              })
          })

          /**
           * @dev Tests fulfillRandomWords() functionality.
           */

          describe("fulfillRandomWords", function () {
              //   beforeEach(async function () {
              //       await randomIpfsNFT.requestNFT({ value: mintFee })
              //   })

              it("Emits when an NFT is minted", async function () {
                  const transaction = await randomIpfsNFT.requestNFT({ value: mintFee })
                  const transactionResponse = await transaction.wait(1)
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          transactionResponse.events[1].args.requestId,
                          randomIpfsNFT.address
                      )
                  ).to.emit(randomIpfsNFT, "NftMinted")
              })
          })

          /**
           * @dev Tests withdraw() functionality.
           */

          describe("withdraw", function () {
              beforeEach(async function () {
                  const transaction = await randomIpfsNFT.requestNFT({ value: mintFee })
                  const transactionResponse = await transaction.wait(1)
              })

              it("Allows the owner to withdraw funds", async function () {
                  const provider = waffle.provider
                  const address = randomIpfsNFT.address
                  const transaction = await randomIpfsNFT.withdraw({ from: deployer })
                  const transactionResponse = transaction.wait(1)
                  const balance = await provider.getBalance(address)
                  assert.equal(balance, "0")
              })

              it("Doesn't allow other users to withdraw funds", async function () {
                  const accounts = await ethers.getSigners()
                  await expect(randomIpfsNFT.withdraw({ from: accounts[1] })).to.be.reverted
              })
          })
      })
