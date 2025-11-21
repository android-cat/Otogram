import React from 'react';

interface YouTubePlayerProps {
    videoId: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
    return (
        <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
        ></iframe>
    );
};

export default YouTubePlayer;
