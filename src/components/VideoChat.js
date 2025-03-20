import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import '../styles/VideoChat.css';

const VideoChat = ({ username, tableId }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  
  const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID;

  useEffect(() => {
    const initializeAgora = async () => {
      try {
        await client.join(AGORA_APP_ID, `poker-table-${tableId}`, null, username);
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        
        setLocalVideoTrack(videoTrack);
        await client.publish([videoTrack, audioTrack]);

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            setRemoteUsers(prev => [...prev, user]);
          }
        });

        client.on("user-unpublished", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        return { videoTrack, audioTrack };
      } catch (error) {
        console.error("Error initializing video:", error);
        return null;
      }
    };

    let tracks;
    initializeAgora().then(result => {
      tracks = result;
    });

    return () => {
      tracks?.videoTrack?.close();
      tracks?.audioTrack?.close();
      client.leave();
    };
  }, [tableId, username]);

  const toggleVideo = async () => {
    if (localVideoTrack) {
      if (isVideoEnabled) {
        await localVideoTrack.setEnabled(false);
      } else {
        await localVideoTrack.setEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localVideoTrack) {
      const audioTrack = client.localTracks.find(track => track.trackMediaType === "audio");
      if (audioTrack) {
        await audioTrack.setEnabled(!isMuted);
        setIsMuted(!isMuted);
      }
    }
  };

  return (
    <div className="video-container">
      <div className="video-controls">
        <button onClick={toggleVideo}>
          {isVideoEnabled ? "Disable Video" : "Enable Video"}
        </button>
        <button onClick={toggleAudio}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>
      <div className="local-video">
        <div ref={el => el && localVideoTrack?.play(el)} className="video-player"></div>
        <div className="player-name">{username} (You)</div>
      </div>
      <div className="remote-videos">
        {remoteUsers.map(user => (
          <div key={user.uid} className="remote-video">
            <div ref={el => el && user.videoTrack?.play(el)} className="video-player"></div>
            <div className="player-name">{user.uid}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoChat; 