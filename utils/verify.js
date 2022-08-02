/**
 * @dev Script to verify contract when deployed to a test or mainnet.
 */
const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("---------------------------------------------")
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        console.log("Contract verified.")
        console.log("---------------------------------------------")
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified.")
            console.log("---------------------------------------------")
        } else {
            console.log(e)
        }
    }
}

module.exports = {
    verify,
}
