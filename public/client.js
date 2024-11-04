const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const ws = new WebSocket('ws://localhost:3000');

let localStream;
let peerConnection;

const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream;
    })
    .catch(error => console.error('Error accessing media devices.', error));

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);

    switch (data.type) {
        case 'offer':
            handleOffer(data.offer);
            break;
        case 'answer':
            handleAnswer(data.answer);
            break;
        case 'candidate':
            handleCandidate(data.candidate);
            break;
        default:
            break;
    }
};

function handleOffer(offer) {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            ws.send(JSON.stringify({ type: 'candidate', candidate }));
        }
    };
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
    peerConnection.addStream(localStream);
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer()
        .then(answer => {
            peerConnection.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', answer }));
        })
        .catch(error => console.error('Error creating answer.', error));
}

function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function call() {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            ws.send(JSON.stringify({ type: 'candidate', candidate }));
        }
    };
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
    peerConnection.addStream(localStream);
    peerConnection.createOffer()
        .then(offer => {
            peerConnection.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: 'offer', offer }));
        })
        .catch(error => console.error('Error creating offer.', error));
}

document.addEventListener('click', call);
