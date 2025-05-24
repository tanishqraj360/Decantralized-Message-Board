pragma solidity ^0.8.0;

struct Message {
  address sender;
  string content;
  uint256 timestamp;
}

contract MessageBoard {
  Message[] public messages;

  event MessagePosted(
    address indexed sender,
    string content,
    uint256 timestamp
  );

  function postMessage(string memory content) public {
    require(bytes(content).length > 0, "Message content cannot be empty");

    Message memory newMessage = Message({
      sender: msg.sender,
      content: content,
      timestamp: block.timestamp
    });

    messages.push(newMessage);
    emit MessagePosted(msg.sender, content, block.timestamp);
  }

  function getAllMessages() public view returns (Message[] memory) {
    return messages;
  }

  function getMessageCount() public view returns (uint256) {
    return messages.length;
  }
}
