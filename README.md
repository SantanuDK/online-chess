# P2P Chess - Serverless Peer-to-Peer Chess Game

A fully client-side chess game that uses WebRTC to connect two players directly without any server infrastructure. Players exchange connection codes manually via chat, email, or any messaging app.

## Features

- ✅ **No Server Required** - Completely peer-to-peer using WebRTC
- ✅ **Manual Code Exchange** - Share connection codes via any messaging app
- ✅ **Full Chess Rules** - Complete chess implementation with legal move validation
- ✅ **Check & Checkmate Detection** - Automatic game state detection
- ✅ **Real-time Synchronization** - Moves are instantly synchronized between players
- ✅ **Modern UI** - Beautiful dark theme with glassmorphism effects
- ✅ **Move History** - Track all moves made during the game

## How to Use

### Getting Started

1. Open `index.html` in your web browser
2. Choose whether to create or join a room

### Player 1 (Room Creator)

1. Click **"Create Room"**
2. Copy the generated **Offer Code** (it will be long, ~500-1000 characters)
3. Send this code to your opponent via chat, email, SMS, or any messaging app
4. Click **"Next: Receive Answer Code"**
5. Wait for your opponent to send you their **Answer Code**
6. Paste the **Answer Code** and click **"Connect"**
7. Wait for the connection to establish
8. You play as **White** and move first!

### Player 2 (Room Joiner)

1. Click **"Join Room"**
2. Paste the **Offer Code** you received from Player 1
3. Click **"Generate Answer"**
4. Copy the generated **Answer Code**
5. Send this code back to Player 1
6. Wait for the connection to establish
7. You play as **Black**

### Playing the Game

- Click on a piece to select it (valid moves will be highlighted)
- Click on a highlighted square to move
- Green dots indicate valid empty squares
- Red highlights indicate capturable pieces
- The game automatically detects check, checkmate, and stalemate
- Use **"New Game"** to start over (requires opponent's approval)
- Use **"Resign"** to forfeit the game

## Technical Details

### WebRTC Connection

The application uses WebRTC data channels for peer-to-peer communication:

- **STUN Servers**: Uses Google's public STUN servers for NAT traversal
- **No Data Relay**: All game data flows directly between players
- **Connection Codes**: Contain SDP (Session Description Protocol) data encoded in Base64

### Why Two Codes?

WebRTC requires a two-way handshake:
1. Player 1 creates an **offer** (their connection details)
2. Player 2 creates an **answer** (their connection details)
3. Both players need each other's information to establish a direct connection

### Code Length

The connection codes are long (~500-1000 characters) because they contain:
- Network configuration (ICE candidates)
- Media capabilities
- Connection parameters

This is normal and necessary for establishing a peer-to-peer connection without a server.

## Browser Compatibility

Works in all modern browsers that support WebRTC:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Troubleshooting

### Connection Not Establishing

1. **Check firewall settings** - Some corporate firewalls block WebRTC
2. **Try a different network** - Some networks have strict NAT that prevents P2P connections
3. **Use a VPN** - Can help bypass restrictive networks
4. **Verify codes** - Make sure you copied the entire code (no truncation)

### Invalid Code Error

- Ensure you copied the complete code without any modifications
- Check for extra spaces or line breaks
- Try copying again from the source

### Connection Drops

- WebRTC connections can be affected by network changes
- If disconnected, you'll need to exchange new codes and reconnect
- The game state is not preserved after disconnection

## Privacy & Security

- **No Server** - Your game data never touches any server
- **Direct Connection** - All communication is peer-to-peer
- **No Tracking** - No analytics or data collection
- **Local Only** - Everything runs in your browser

## Limitations

- **No Reconnection** - If the connection drops, you need to exchange new codes
- **No Game State Persistence** - Closing the browser ends the game
- **Network Dependent** - Requires both players to have WebRTC-compatible networks
- **Manual Code Exchange** - Requires a separate communication channel

## Development

The application consists of:
- `index.html` - Main HTML structure
- `styles.css` - Styling and animations
- `chess.js` - Chess game logic and rules
- `webrtc.js` - WebRTC connection management
- `app.js` - Main application controller

All code is vanilla JavaScript with no external dependencies!

## License

Free to use and modify for any purpose.

## Credits

Built with ❤️ using WebRTC and vanilla JavaScript.
