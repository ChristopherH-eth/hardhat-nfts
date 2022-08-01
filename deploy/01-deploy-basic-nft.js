const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

/**
 * @dev This is a deploy script for the BasicNFT contract.
 */

/**
 * @dev This function passes getNamedAccounts to get the user accounts, and deployments
 * @dev to use deploy and log functionality from hre (Hardhat Runtime Environment).
 * @param deploy Using deploy from hre to deploy mocks.
 * @param log Using log to simplify logging.
 * @param args Array of correspond args from "helper-hardhat-config" for contract
 * deployment (empty in this case).
 * @param deployer Using deployer account for deploying mocks.
 * @param basicNft Deploys the RandomIpfsNFT smart contract while passing the
 * following:
 * 1. from: deployer (contract deployer)
 * 2. args: args (passes args constant)
 * 3. log: true (enables logging on deployment)
 * 4. waitConfirmations waits a predetermined number of block confirmations
 * based on the network or 1.
 */

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("---------------------------------------------")
    const args = []
    const basicNft = await deploy("BasicNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Call verify script if not on local blockchain and Etherscan API key is present
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(basicNft.address, args)
    }
    log("---------------------------------------------")
}

module.exports.tags = ["all", "basicnft", "main"]
