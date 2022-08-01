const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

/**
 * @dev This is a script to mint the Basic NFT, the Random IPFS NFT, and the Dynamic
 * SVG NFT.
 */

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    // Basic NFT
    const basicNFT = await ethers.getContract("BasicNFT", deployer)
    const basicMintTx = await basicNFT.mintNFT()
    await basicMintTx.wait(1)

    console.log(`Basic NFT index 0 has tokenURI: ${await basicNFT.tokenURI(0)}`)

    // Random IPFS NFT
    const randomIpfsNFT = await ethers.getContract("RandomIpfsNFT", deployer)
    const mintFee = await randomIpfsNFT.getMintFee()

    await new Promise(async function (resolve, reject) {
        setTimeout(resolve, 300000)
        randomIpfsNFT.once("NftMinted", async function () {
            resolve()
        })
        const randomIpfsNFTMintTx = await randomIpfsNFT.requestNFT({ value: mintFee.toString() })
        const randomIpfsNFTMintTxResponse = await randomIpfsNFTMintTx.wait(1)

        if (developmentChains.includes(network.name)) {
            const requestId = randomIpfsNFTMintTxResponse.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNFT.address)
        }
    })

    console.log(`Random IPFS NFT index 0 token URI: ${await randomIpfsNFT.tokenURI(0)}`)

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNFT = await ethers.getContract("DynamicSvgNFT", deployer)

    await new Promise(async function (resolve, reject) {
        setTimeout(resolve, 300000)
        dynamicSvgNFT.once("CreatedNFT", async function () {
            resolve()
        })
        const dynamicSvgNFTMintTx = await dynamicSvgNFT.mintNft(highValue)
        await dynamicSvgNFTMintTx.wait(1)
    })

    console.log(`Dynamic SVG NFT index 0 token URI: ${await dynamicSvgNFT.tokenURI(0)}`)
}
