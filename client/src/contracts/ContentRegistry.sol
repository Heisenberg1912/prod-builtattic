// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ContentRegistry
 * @dev Simple registry for anchoring content hashes on Polygon blockchain
 * @notice This contract stores content hashes with timestamps for verification
 */
contract ContentRegistry {
    // Mapping from content hash to timestamp (0 = not anchored)
    mapping(bytes32 => uint256) public anchors;

    // Mapping from content hash to studio type
    mapping(bytes32 => string) public studioTypes;

    // Mapping from content hash to original ID
    mapping(bytes32 => string) public contentIds;

    // Owner for admin functions
    address public owner;

    // Events
    event Anchored(bytes32 indexed contentHash, string id, string studioType, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Anchor a content hash to the blockchain
     * @param contentHash The keccak256 hash of the content
     * @param id The original ID of the content (design/skill/material ID)
     * @param studioType The type of studio ("design", "skill", "material")
     */
    function anchor(
        bytes32 contentHash,
        string calldata id,
        string calldata studioType
    ) external onlyOwner {
        require(anchors[contentHash] == 0, "Content already anchored");

        anchors[contentHash] = block.timestamp;
        studioTypes[contentHash] = studioType;
        contentIds[contentHash] = id;

        emit Anchored(contentHash, id, studioType, block.timestamp);
    }

    /**
     * @dev Batch anchor multiple content hashes
     * @param contentHashes Array of content hashes
     * @param ids Array of content IDs
     * @param studioTypesArr Array of studio types
     */
    function batchAnchor(
        bytes32[] calldata contentHashes,
        string[] calldata ids,
        string[] calldata studioTypesArr
    ) external onlyOwner {
        require(
            contentHashes.length == ids.length && ids.length == studioTypesArr.length,
            "Array lengths must match"
        );

        for (uint256 i = 0; i < contentHashes.length; i++) {
            if (anchors[contentHashes[i]] == 0) {
                anchors[contentHashes[i]] = block.timestamp;
                studioTypes[contentHashes[i]] = studioTypesArr[i];
                contentIds[contentHashes[i]] = ids[i];

                emit Anchored(contentHashes[i], ids[i], studioTypesArr[i], block.timestamp);
            }
        }
    }

    /**
     * @dev Check if content is anchored
     * @param contentHash The content hash to check
     * @return bool True if anchored
     */
    function isAnchored(bytes32 contentHash) external view returns (bool) {
        return anchors[contentHash] > 0;
    }

    /**
     * @dev Get the timestamp when content was anchored
     * @param contentHash The content hash to check
     * @return uint256 Timestamp (0 if not anchored)
     */
    function getTimestamp(bytes32 contentHash) external view returns (uint256) {
        return anchors[contentHash];
    }

    /**
     * @dev Get full anchor info
     * @param contentHash The content hash to check
     * @return timestamp The anchor timestamp
     * @return id The original content ID
     * @return studioType The studio type
     */
    function getAnchorInfo(bytes32 contentHash) external view returns (
        uint256 timestamp,
        string memory id,
        string memory studioType
    ) {
        return (
            anchors[contentHash],
            contentIds[contentHash],
            studioTypes[contentHash]
        );
    }

    /**
     * @dev Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
