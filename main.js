console.log("test");
const APP_ID='9edc892de5af4fa6b4184e89ac727a57'

let token =null;
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel

let localStream; // video
let remoteStream; // Connected another  user get Their voice , camera 
let peerConnection;

const servers={
    iceServers:[{
        urls:['stun:stun1.1.google.com:19302','stun:stun2.1.google.com:19302']
    }]
}
 // Ask for permission to acces your video and voice able to test !
 let init = async ()=>{

    client=await AgoraRTM.createInstance(APP_ID)
    await client.login({uid,token})

    channel=client.createChannel('main')
    await channel.join()

    channel.on('MemberJoined',handleUserJoined)
    client.on('MessageFromPeer',handleMessageFromPeer)   
}

let handleMessageFromPeer = async (message, MemberId) => {

    message = JSON.parse(message.text)

    if(message.type === 'offer'){
        createAnswer(MemberId, message.offer)
    }

    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }


}

let handleUserJoined = async (MemberId) => {
    console.log('A new user joined the channel:', MemberId)
    createOffer(MemberId)
}

let createPeerConnection = async (MemberId)=>{
    peerConnection= new RTCPeerConnection(servers)

    remoteStream= new MediaStream()
    document.get=document.getElementById('user-2').srcObject=remoteStream;

    if(!localStream){
        localStream= await navigator.mediaDevices.getUserMedia({video:true,audio:false})
    // document.get=document.getElementById('user-1').srcObject=localStream;
        document.getElementById('user-1').srcObject=localStream;

    }

// GET TRACK

localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream)
})
 
// Adding track aom user-2 object ! 
peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
    })
}

peerConnection.onicecandidate = async (event) => {
    if(event.candidate){
        client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId)
    }
}

}

 // Connection second user ( group chat )
 let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId)
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
}

let createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId)
}

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

init(); 