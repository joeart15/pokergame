import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const VideoChat = ({ username, tableId }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  
  const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID;

  useEffect(() => {
    const initializeAgora = async () => {
      try {
        await client.join(AGORA_APP_ID, `poker-table-${tableId}`, null, username);
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(videoTrack);
        await client.publish([videoTrack]);

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            setRemoteUsers(prev => [...prev, user]);
          }
        });

        client.on("user-unpublished", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });
      } catch (error) {
        console.error("Error initializing video:", error);
      }
    };

    initializeAgora();
    return () => {
      localVideoTrack?.close();
      client.leave();
    };
  }, [tableId, username]);

  return (
    <div className="video-container">
      <div className="local-video">
        <div ref={el => el && localVideoTrack?.play(el)} className="video-player"></div>
        <div className="player-name">{username}</div>
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