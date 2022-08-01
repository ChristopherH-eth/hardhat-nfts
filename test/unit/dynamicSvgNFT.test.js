const { assert, expect } = require("chai")
const { ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const fs = require("fs")

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

          describe("constructor", function () {
              it("Initializes the contract accordingly", async function () {
                  const tokenCounter = await dynamicSvgNFT.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("svgToImageURI", function () {
              it("Encodes an .svg file using Base64", async function () {
                  try {
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
                  } catch (error) {
                      console.log(error)
                  }
              })
          })

          describe("mintNft", function () {
              it("Mints an NFT, emits an event, and adjusts the token counter", async function () {
                  const highValue = ethers.utils.parseEther("4000")
                  const tokenCounter = await dynamicSvgNFT.getTokenCounter()
                  console.log("Setting up event listener...")
                  await new Promise(async function (resolve, reject) {
                      dynamicSvgNFT.once("CreatedNFT", async function () {
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

          describe("tokenURI", function () {
              it("Encodes the token URI .svg file and metadata", async function () {
                  const highValue = ethers.utils.parseEther("4000")
                  console.log("Setting up event listener...")
                  await new Promise(async function (resolve, reject) {
                      dynamicSvgNFT.once("CreatedNFT", async function () {
                          try {
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      const transaction = await dynamicSvgNFT.mintNft(highValue)
                      const transactionResponse = await transaction.wait(1)
                      console.log("Minted token. Listening for event...")
                  })
                  const tokenId = await dynamicSvgNFT.getTokenCounter()
                  const encodedURI = await dynamicSvgNFT.tokenURI(tokenId)
                  console.log(encodedURI)
              })
          })
      })
