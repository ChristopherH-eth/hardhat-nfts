// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

/**
 * @title Hardhat NFT Contract
 * @author 0xChristopher
 * @notice This contract is for creating basic NFTs.
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNFT is ERC721 {
    // State Variables
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";
    uint256 private s_tokenCounter;

    /**
     * @dev Imported ERC721 constructor from Open Zeppelin's ERC721.sol.
     */

    constructor() ERC721("Dogie", "DOG") {
        s_tokenCounter = 0;
    }

    /**
     * @dev The mintNFT() function mints a new NFT.
     */

    function mintNFT() public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    }

    /**
     * @dev The tokenURI() function overrides the Open Zeppeling tokenURI() function
     * @dev and returns a TOKEN_URI.
     */

    function tokenURI(
        uint256 /* tokenId */
    ) public view override returns (string memory) {
        return TOKEN_URI;
    }

    /**
     * @dev Public view functions for private variables.
     */

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
