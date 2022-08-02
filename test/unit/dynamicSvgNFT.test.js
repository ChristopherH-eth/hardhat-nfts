const { assert, expect } = require("chai")
const { ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const fs = require("fs")

/**
 * @notice These are the unit tests for the Dynamic SVG NFT smart contract.
 * @dev Before each unit test we get our deployer account, and deploy the DynamicSvgNFT and
 * MockV3Aggregator contracts.
 */

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("DynamicSvgNFT", function () {
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["dynamicsvg"])
              dynamicSvgNFT = await ethers.getContract("DynamicSvgNFT")
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
              chainId = network.config.chainId
          })

          /**
           * @dev Tests constructor functionality.
           */

          describe("constructor", function () {
              it("Initializes the contract accordingly", async function () {
                  const tokenCounter = await dynamicSvgNFT.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          /**
           * @dev Tests svgToImageURI() functionality.
           */

          describe("svgToImageURI", function () {
              it("Encodes an .svg file using Base64", async function () {
                  const lowSVG = await fs.readFileSync("./images/dynamicNFT/frown.svg", {
                      encoding: "utf8",
                  })
                  const highSVG = await fs.readFileSync("./images/dynamicNFT/happy.svg", {
                      encoding: "utf8",
                  })
                  const lowSVGEncoded = await dynamicSvgNFT.svgToImageURI(lowSVG)
                  const highSVGEncoded = await dynamicSvgNFT.svgToImageURI(highSVG)

                  expect(lowSVGEncoded).to.be.a("string")
                  expect(highSVGEncoded).to.be.a("string")
                  console.log(`lowSVG encoded value: ${lowSVGEncoded}`)
                  console.log(`highSVG encoded value: ${highSVGEncoded}`)
              })
          })

          /**
           * @dev Tests mintNft() functionality.
           */

          describe("mintNft", function () {
              it("Mints an NFT, emits an event, and adjusts the token counter", async function () {
                  const highValue = ethers.utils.parseEther("4000")
                  const tokenCounter = await dynamicSvgNFT.getTokenCounter()
                  console.log("Setting up event listener...")

                  await new Promise(async function (resolve, reject) {
                      dynamicSvgNFT.once("CreatedNFT", async function () {
                          console.log("'CreatedNFT' event emitted")
                          try {
                              const newTokenCounter = await dynamicSvgNFT.getTokenCounter()
                              assert.equal(tokenCounter, "0")
                              assert.equal(newTokenCounter, "1")
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      await dynamicSvgNFT.mintNft(highValue)
                      console.log("Minted token. Listening for event...")
                  })
              })
          })

          /**
           * @dev Tests tokenURI() functionality.
           */

          describe("tokenURI", function () {
              it("Encodes the token URI .svg file and metadata", async function () {
                  const tokenId = await dynamicSvgNFT.getTokenCounter()
                  const highValue = ethers.utils.parseEther("4000")
                  console.log("Setting up event listener...")

                  await new Promise(async function (resolve, reject) {
                      dynamicSvgNFT.once("CreatedNFT", async function () {
                          console.log("'CreatedNFT' event emitted")
                          try {
                              const encodedURI = await dynamicSvgNFT.tokenURI(tokenId)
                              expect(encodedURI).to.be.a("string")
                              console.log(encodedURI)
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      const transaction = await dynamicSvgNFT.mintNft(highValue)
                      await transaction.wait(1)
                      console.log("Minted token. Listening for event...")
                  })
              })
          })
      })
