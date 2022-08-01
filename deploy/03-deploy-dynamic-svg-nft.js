const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

/**
 * @dev This is a deploy script for the DynamicSvgNFT contract.
 */

/**
 * @dev This function passes getNamedAccounts to get the user accounts, and deployments
 * @dev to use deploy and log functionality from hre (Hardhat Runtime Environment).
 * @param deploy Using deploy from hre to deploy mocks.
 * @param log Using log to simplify logging.
 * @param deployer Using deployer account for deploying mocks.
 * @param ethUsdPriceFeedAddress Takes the contract address of either the deployed mock
 * or the contract address on the corresponding network.
 */

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress

    /**
     * @dev Detects network and deploys mocks if on a local blockchain; else, it grabs the
     * @dev price feed address for the connected network.
     * @param ethUsdPriceFeed Gets contract info for MockV3Aggregator if a local blockchain
     * is detected.
     */

    if (developmentChains.includes(network.name)) {
        log("Local blockchain detected. Deploying mocks...")

        const ethUsdPriceFeed = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdPriceFeed.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    /**
     * @param lowSVG Reads and encodes the .svg file for dynamic NFT minting with a low price.
     * @param highSVG Reads and encodes the .svg file for dynamic NFT minting with a high price.
     * @param args Array of correspond args from "helper-hardhat-config" for contract
     * deployment.
     * @param dynamicNFT Deploys the RandomIpfsNFT smart contract while passing the
     * following:
     * 1. from: deployer (contract deployer)
     * 2. args: args (passes args constant)
     * 3. log: true (enables logging on deployment)
     * 4. waitConfirmations waits a predetermined number of block confirmations
     * based on the network or 1.
     */

    log("---------------------------------------------")
    const lowSVG = await fs.readFileSync("./images/dynamicNFT/frown.svg", { encoding: "utf8" })
    const highSVG = await fs.readFileSync("./images/dynamicNFT/happy.svg", { encoding: "utf8" })
    const args = [ethUsdPriceFeedAddress, lowSVG, highSVG]

    log("Deploying contract...")

    dynamicSvgNFT = await deploy("DynamicSvgNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
    })

    log("Contract deployed.")

    // Call verify script if not on local blockchain and Etherscan API key is present
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying contract...")
        await verify(dynamicSvgNFT.address, args)
        log("Contract verified.")
    }
    log("---------------------------------------------")
}

module.exports.tags = ["all", "dynamicsvg", "main"]
