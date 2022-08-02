const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

/**
 * @dev This is a script to mint the Basic NFT, the Random IPFS NFT, and the Dynamic
 * SVG NFT.
 */

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    /**
     * @dev Basic NFT minting code block.
     */

    const basicNFT = await ethers.getContract("BasicNFT", deployer)
    const basicMintTx = await basicNFT.mintNFT()
    await basicMintTx.wait(1)

    console.log(`Basic NFT index 0 has tokenURI: ${await basicNFT.tokenURI(0)}`)

    /**
     * @dev Random IPFS NFT minting code block.
     */

    const randomIpfsNFT = await ethers.getContract("RandomIpfsNFT", deployer)
    const mintFee = await randomIpfsNFT.getMintFee()
    const randomIpfsNFTMintTx = await randomIpfsNFT.requestNFT({ value: mintFee.toString() })
    const randomIpfsNFTMintTxResponse = await randomIpfsNFTMintTx.wait(1)

    await new Promise(async function (resolve, reject) {
        setTimeout(async function () {
            reject("Timeout: 'NFTMinted' event did not execute")
        }, 600000) // 10 minutes
        randomIpfsNFT.once("NftMinted", async function () {
            resolve()
        })

        // Check for local blockchain
        if (developmentChains.includes(network.name)) {
            const requestId = randomIpfsNFTMintTxResponse.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNFT.address)
        }
    })

    console.log(`Random IPFS NFT index 0 token URI: ${await randomIpfsNFT.tokenURI(0)}`)

    /**
     * @dev Dynamic SVG NFT minting code block.
     */
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNFT = await ethers.getContract("DynamicSvgNFT", deployer)

    await new Promise(async function (resolve, reject) {
        setTimeout(async function () {
            reject("Timeout: 'CreatedNFT' event did not execute")
        }, 300000) // 5 minutes
        dynamicSvgNFT.once("CreatedNFT", async function () {
            resolve()
        })
        const dynamicSvgNFTMintTx = await dynamicSvgNFT.mintNft(highValue)
        await dynamicSvgNFTMintTx.wait(1)
    })

    console.log(`Dynamic SVG NFT index 0 token URI: ${await dynamicSvgNFT.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
