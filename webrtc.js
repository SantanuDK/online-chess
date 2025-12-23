// WebRTC Connection Manager
class WebRTCConnection {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.onMessageCallback = null;
        this.onConnectionStateChangeCallback = null;
        this.isInitiator = false;

        // Public STUN servers for NAT traversal
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
    }

    // Create offer (Player 1 - Room Creator)
    async createOffer() {
        this.isInitiator = true;
        this.peerConnection = new RTCPeerConnection(this.iceServers);

        // Create data channel
        this.dataChannel = this.peerConnection.createDataChannel('chess-game');
        this.setupDataChannel();

        // Setup connection state monitoring
        this.setupConnectionStateMonitoring();

        // Create offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        // Wait for ICE gathering to complete
        await this.waitForICEGathering();

        // Return the complete offer with ICE candidates
        const offerData = {
            type: 'offer',
            sdp: this.peerConnection.localDescription
        };

        return this.encodeConnectionData(offerData);
    }

    // Process offer and create answer (Player 2 - Room Joiner)
    async createAnswer(offerCode) {
        this.isInitiator = false;
        this.peerConnection = new RTCPeerConnection(this.iceServers);

        // Setup data channel listener
        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel();
        };

        // Setup connection state monitoring
        this.setupConnectionStateMonitoring();

        // Decode and set remote description
        const offerData = this.decodeConnectionData(offerCode);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerData.sdp));

        // Create answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // Wait for ICE gathering to complete
        await this.waitForICEGathering();

        // Return the complete answer with ICE candidates
        const answerData = {
            type: 'answer',
            sdp: this.peerConnection.localDescription
        };

        return this.encodeConnectionData(answerData);
    }

    // Process answer (Player 1 receives this from Player 2)
    async processAnswer(answerCode) {
        const answerData = this.decodeConnectionData(answerCode);
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerData.sdp));
    }

    waitForICEGathering() {
        return new Promise((resolve) => {
            if (this.peerConnection.iceGatheringState === 'complete') {
                resolve();
            } else {
                const checkState = () => {
                    if (this.peerConnection.iceGatheringState === 'complete') {
                        this.peerConnection.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                };
                this.peerConnection.addEventListener('icegatheringstatechange', checkState);
            }
        });
    }

    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            if (this.onConnectionStateChangeCallback) {
                this.onConnectionStateChangeCallback('connected');
            }
        };

        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
            if (this.onConnectionStateChangeCallback) {
                this.onConnectionStateChangeCallback('disconnected');
            }
        };

        this.dataChannel.onmessage = (event) => {
            if (this.onMessageCallback) {
                const data = JSON.parse(event.data);
                this.onMessageCallback(data);
            }
        };

        this.dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
            if (this.onConnectionStateChangeCallback) {
                this.onConnectionStateChangeCallback('error');
            }
        };
    }

    setupConnectionStateMonitoring() {
        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            if (this.onConnectionStateChangeCallback) {
                const state = this.peerConnection.connectionState;
                if (state === 'connected') {
                    this.onConnectionStateChangeCallback('connected');
                } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    this.onConnectionStateChangeCallback('disconnected');
                } else if (state === 'connecting') {
                    this.onConnectionStateChangeCallback('connecting');
                }
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.peerConnection.iceConnectionState);
        };
    }

    encodeConnectionData(data) {
        const jsonString = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(jsonString)));
    }

    decodeConnectionData(code) {
        try {
            const jsonString = decodeURIComponent(escape(atob(code)));
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error('Invalid connection code');
        }
    }

    sendMessage(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(data));
            return true;
        }
        return false;
    }

    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    onConnectionStateChange(callback) {
        this.onConnectionStateChangeCallback = callback;
    }

    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
    }

    isConnected() {
        return this.dataChannel && this.dataChannel.readyState === 'open';
    }
}
