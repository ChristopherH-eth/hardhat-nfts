const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { getNamedAccounts, ethers, network, deployments, waffle } = require("hardhat")
const { assert, expect } = require("chai")

/**
 * @notice These are the unit tests for the Random IPFS NFT smart contract.
 * @dev Before each unit test we get our deployer account, and deploy the RandomIpfsNFT and
 * VRFCoordinatorV2Mock contracts.
 */

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

              it("Returns a requestId", async function () {
                  const transaction = await randomIpfsNFT.requestNFT({ value: mintFee })
                  const transactionResponse = await transaction.wait(1)
                  const requestId = transactionResponse.events[1].args.requestId.toString()
                  console.log(`requestId is ${requestId}`)

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

              it("Counts each minted NFT", async function () {
                  const counter = await randomIpfsNFT.getTokenCounter()
                  console.log(`Token counter set to ${counter}`)
                  const transaction = await randomIpfsNFT.requestNFT({ value: mintFee })
                  const transactionResponse = await transaction.wait(1)
                  console.log("Setting event listener...")

                  await new Promise(async function (resolve, reject) {
                      randomIpfsNFT.once("NftMinted", async function () {
                          console.log("'NftMinted' event emitted")
                          try {
                              const newCounter = await randomIpfsNFT.getTokenCounter()
                              console.log(`Token counter updated to ${newCounter}`)

                              assert.equal(counter.toString(), "0")
                              assert.equal(newCounter.toString(), "1")
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      console.log("Requesting randomness...")
                      const vrfMock = await vrfCoordinatorV2Mock.fulfillRandomWords(
                          transactionResponse.events[1].args.requestId,
                          randomIpfsNFT.address
                      )
                      await vrfMock.wait(1)
                      console.log("Listening for event...")
                  })
              })
          })

          /**
           * @dev Tests withdraw() functionality.
           */

          describe("withdraw", function () {
              beforeEach(async function () {
                  const transaction = await randomIpfsNFT.requestNFT({ value: mintFee })
                  await transaction.wait(1)
              })

              it("Allows the owner to withdraw funds", async function () {
                  const provider = waffle.provider
                  const address = randomIpfsNFT.address
                  console.log("Attempting to withdraw funds as contract owner...")
                  const transaction = await randomIpfsNFT.withdraw({ from: deployer })
                  const transactionResponse = transaction.wait(1)
                  const balance = await provider.getBalance(address)

                  assert.equal(balance, "0")
              })

              it("Doesn't allow other users to withdraw funds", async function () {
                  const accounts = await ethers.getSigners()
                  console.log("Attempting to withdraw funds as non-owner...")

                  await expect(randomIpfsNFT.withdraw({ from: accounts[1] })).to.be.reverted
              })
          })

          /**
           * @dev Tests getBreedFromModdedRng() functionality.
           */

          describe("getBreedFromModdedRng", function () {
              it("Returns correct dog breeds upon random selection", async function () {
                  let getBreed = []
                  const requestNFT = await randomIpfsNFT.requestNFT({ value: mintFee })
                  const requestNFTResponse = await requestNFT.wait(1)
                  console.log("NFT mint request received")
                  console.log("Setting event listener...")

                  await new Promise(async function (resolve, reject) {
                      randomIpfsNFT.once("NftMinted", async function () {
                          console.log("'NftMinted' event emitted")
                          try {
                              for (i = 0; i < 10; i++) {
                                  getBreed[i] = await randomIpfsNFT.getBreedFromModdedRng(i)
                                  assert.equal(getBreed[i], "0")
                              }
                              console.log("Pugs return correctly")
                              for (i = 10; i < 30; i++) {
                                  getBreed[i] = await randomIpfsNFT.getBreedFromModdedRng(i)
                                  assert.equal(getBreed[i], "1")
                              }
                              console.log("Shibas return correctly")
                              for (i = 30; i < 100; i++) {
                                  getBreed[i] = await randomIpfsNFT.getBreedFromModdedRng(i)
                                  assert.equal(getBreed[i], "2")
                              }
                              console.log("St. Bernard return correctly")
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      console.log("Requesting randomness...")
                      const vrfMock = await vrfCoordinatorV2Mock.fulfillRandomWords(
                          requestNFTResponse.events[1].args.requestId,
                          randomIpfsNFT.address
                      )
                      await vrfMock.wait(1)
                      console.log("Listening for event...")
                  })
              })
          })
      })
