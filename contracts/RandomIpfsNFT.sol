// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

/**
 * @title Random IPFS NFT
 * @author 0xChristopher
 * @notice This contract is for creating NFTs using IPFS and Chainlink VRF for
 * randomness.
 */

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNFT__RangeOutOfBounds();
error RandomIpfsNFT__NeedMoreETHSent();
error RandomIpfsNFT__TransferFailed();

contract RandomIpfsNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // Type Declaration
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    // VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) private s_requestIdToSender;

    // NFT Variables
    uint256 private s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint256 internal i_mintFee;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    /**
     * @param vrfCoordinatorV2 is the address of the Chainlink VRFCoordinatorV2.
     * @param subscriptionId is the Id used by the VRFCoordinatorV2 to check if the sending
     * contract is a valid consumer, and if so, proceeds to request randomness from the
     * Chainlink Keeper.
     * @param gasLane is the key hash for corresponding gwei requirement.
     * @param callBackGasLimit is the maximum gas limit for the contract to deploy with.
     * @param dogTokenUris is a string array of dog token URIs.
     * @param mintFee is the cost to mint a dog NFT.
     */

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callBackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callBackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mintFee;
    }

    /**
     * @dev The requestNFT() function checks to make sure the user has spent enough ETH,
     * @dev then requests a random number through the Chainlink VRF to get a random NFT.
     * @dev Emits NftRequested() event upon completion.
     * @param requestId represents the requestId for the randomness from the Chainlink
     * node. It's also used to ensure the NFT is minted to the user, not the Chainlink
     * node responding to the requestRandomWords() call.
     * @return requestId
     */

    function requestNFT() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNFT__NeedMoreETHSent();
        }

        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;

        emit NftRequested(requestId, msg.sender);
    }

    /**
     * @dev The fulfillRandomWords() function receives the random number from the Chainlink
     * @dev node, then based on the randomWords[0] modulo MAX_CHANCE_VALUE calculation,
     * @dev a dog breed will be determined at random and subsequently minted for the user.
     * @dev The _safeMint() function then mints the token to the user with the token id.
     * @dev The _setTokenURI() function sets the token's URI according to the token id and the Breed.
     * @dev Emits NftMinted() event upon completion.
     * @param requestId represents the requestId for the randomness from the Chainlink
     * node.
     * @param randomWords is the random value returned by the Chainlink node.
     */

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address dogOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;

        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        s_tokenCounter += s_tokenCounter;
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);

        emit NftMinted(dogBreed, dogOwner);
    }

    /**
     * @dev The withdraw() function allows only the owner of the contract to withdraw funds.
     */

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNFT__TransferFailed();
        }
    }

    /**
     * @dev The getBreedFromModdedRng() function loops through the chanceArray checking if
     * @dev the value of moddedRng is greater than or equal to the cumulativeSum AND less than
     * @dev the chanceArray value of the current index i. If both are true the function returns
     * @dev the Breed based on the enum Breed.
     * @param moddedRng is the modulo calculation of randomWords[0] from the Chainlink node, and
     * MAX_CHANCE_VALUE from the chanceArray[].
     * @return Breed
     */

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();

        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNFT__RangeOutOfBounds();
    }

    /**
     * @dev The getChanceArray() function returns the chanceArray for the moddedRng calculation,
     * @dev (see getBreedFromModdedRng() function).
     * @return [3]
     */

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    /**
     * @dev The function getMintFee() returns the mint fee.
     */

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    /**
     * @dev The function getDogTokenUris() returns the dog token URI at a given index.
     */

    function getDogTokenUris(uint256 index) public view returns (string memory) {
        return s_dogTokenUris[index];
    }

    /**
     * @dev The getTokenCounter() function returns the token counter.
     */

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
