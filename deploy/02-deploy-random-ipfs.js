const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

/**
 * @dev This is a deploy script for the RandomIpfsNFT contract.
 */

/**
 * @param imagesLocation Location of NFT images.
 * @param metadataTemplate NFT metadata template for Token URIs.
 */

const imagesLocation = "./images/randomNFT"
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}
const FUND_AMOUNT = ethers.utils.parseEther("10") // 10 LINK

/**
 * @dev This function passes getNamedAccounts to get the user accounts, and deployments
 * @dev to use deploy and log functionality from hre (Hardhat Runtime Environment). If a
 * @dev local blockchain is detected via network.name, mocks are deployed; otherwise, the
 * @dev function proceeds directly to RandfomIpfsNFT smart contract deployment.
 * @param deploy Using deploy from hre to deploy mocks.
 * @param log Using log to simplify logging.
 * @param deployer Using deployer account for deploying mocks.
 * @param chainId Grabs corresponding network chainId from "../helper-hardhat-config.js".
 * @param vrfCoordinatorV2Address Takes the contract address of either the deployed mock
 * or the contract address on the corresponding network.
 * @param subscriptionId The subscription ID emitted from the VRFCoordinatorV2Mock (or
 * VRFCoordinatorV2 if on a testnet) when calling createSubscription().
 * @param tokenUris Used to store token URIs and set UPLOAD_TO_PINATA to false when no
 * longer needed.
 */

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId
    let tokenUris = [
        "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
        "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
        "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
    ]

    // Handle Token URIs if uploading to Pinata
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    /**
     * @dev Detects network and deploys mocks if on a local blockchain; else, it grabs the
     * @dev VRFCoordinatorV2 address for the connected network.
     * @param vrfCoordinatorV2Mock Gets contract info for VRFCoordinatorV2Mock.
     * @param tx Waits for createSubscription function.
     * @param txReceipt Waits 1 block for subscription creation.
     */

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await tx.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    /**
     * @param entranceFee Contains an entranceFee for the connected network.
     * @param gasLane Key hash for corresponding gwei requirement.
     * @param callBackGasLimit Maximum gas limit for the contract to deploy with.
     * @param interval Interval requirement for checkUpkeep function.
     * @param args Array of correspond args from "helper-hardhat-config" for contract
     * deployment.
     * @param randomIpfsNFT Deploys the Lottery smart contract while passing the
     * following:
     * 1. from: deployer (contract deployer)
     * 2. args: args (passes args constant)
     * 3. log: true (enables logging on deployment)
     * 4. waitConfirmations waits a predetermined number of block confirmations
     * based on the network or 1.
     */

    log("---------------------------------------------")
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callBackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNFT = await deploy("RandomIpfsNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Call verify script if not on local blockchain and Etherscan API key is present
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNFT.address, args)
    }
    log("---------------------------------------------")
}

/**
 * @dev The handleTokenUris() function handles tokens by storing their image and metadata
 * in Pinata.
 * @param imageUploadResponses is the image returned by the storeImages function.
 * @param imageUploadResponseIndex is the index of a given image returned by the storeImages function.
 * @param tokenUriMetadata contains the metadata of a token per the metadataTemplate.
 * @param metadataUploadResponse is the response from the storeTokenUriMetadata function which can then
 * be used with ".IpfsHash" to get the CID and push it to Pinata.
 */

async function handleTokenUris() {
    tokenUris = []
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)

    for (imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }

    console.log("Token URIs Uploaded! They are:")
    console.log(tokenUris)

    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
