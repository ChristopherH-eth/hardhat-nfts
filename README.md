# Hardhat NFT Project

## Basic NFTs (BasicNFT.sol)
This contract allows the user to create a simplistic NFT.

## Random IPFS NFT (RandomIpfsNFT.sol)
This contract allows the user to create one of three NFTs at random. Each
NFT has a different percentage of being minted with the following probabilities:
- Pug: Super rare (10%)
- Shiba Inu: Sort of rare (30%)
- St. Bernard: Common (60%)

Chainlink VRF is used to verify randomness, the user will have to pay to mint the
NFT, and only the contract owner will be able to withdraw the funds.